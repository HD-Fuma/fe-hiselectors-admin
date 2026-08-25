import { useEffect, useState, type FormEvent } from "react";
import { Button, Checkbox, TextInput } from "../../components/ui/Controls";
import { SidePanel } from "../../components/ui/SidePanel";
import { StatusPill } from "../../components/ui/StatusPill";
import {
  createDiscoveryKeyword,
  deleteDiscoveryCategory,
  deleteDiscoveryKeyword,
  getDiscoveryCategories,
  updateDiscoveryCategory,
  updateDiscoveryKeyword,
  type DiscoveryCategory,
  type DiscoveryKeyword,
} from "../../entities/discovery-category";

interface CategoryDraft {
  id: number;
  name: string;
  displayOrder: string;
  enabled: boolean;
}

interface KeywordDraft {
  id: number | null;
  keyword: string;
  priority: string;
  enabled: boolean;
}

function reasonMessage(reason: unknown, fallback: string) {
  return reason instanceof Error ? reason.message : fallback;
}

function emptyKeywordDraft(): KeywordDraft {
  return { id: null, keyword: "", priority: "0", enabled: true };
}

const RELOAD_ERROR = "변경사항은 저장됐지만 목록을 새로고침하지 못했습니다. 패널을 닫았다 다시 열어 주세요.";

export function DiscoverySettingsPanel({ onClose }: { onClose: () => void }) {
  const [categories, setCategories] = useState<DiscoveryCategory[]>([]);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [categoryDraft, setCategoryDraft] = useState<CategoryDraft | null>(null);
  const [keywordDraft, setKeywordDraft] = useState<KeywordDraft | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const selectedCategory = categories.find((category) => category.id === selectedId) ?? null;

  async function reload(preferredId?: number) {
    const nextCategories = await getDiscoveryCategories();
    setCategories(nextCategories);
    setSelectedId((current) => {
      const nextId = preferredId ?? current;
      return nextCategories.some((category) => category.id === nextId)
        ? nextId
        : nextCategories[0]?.id ?? null;
    });
  }

  useEffect(() => {
    const controller = new AbortController();
    getDiscoveryCategories(controller.signal)
      .then((nextCategories) => {
        setCategories(nextCategories);
        setSelectedId(nextCategories[0]?.id ?? null);
      })
      .catch((reason: unknown) => {
        if (!controller.signal.aborted) setError(reasonMessage(reason, "발굴 설정을 불러오지 못했습니다."));
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });
    return () => controller.abort();
  }, []);

  async function finishMutation(preferredId: number | undefined, success: string) {
    setNotice(success);
    try {
      await reload(preferredId);
    } catch {
      setError(RELOAD_ERROR);
    }
  }

  async function mutate(task: () => Promise<unknown>, preferredId: number | undefined, success: string) {
    setSaving(true);
    setError("");
    setNotice("");
    try {
      await task();
      await finishMutation(preferredId, success);
      return true;
    } catch (reason) {
      setError(reasonMessage(reason, "요청에 실패했습니다."));
      return false;
    } finally {
      setSaving(false);
    }
  }

  async function saveCategory(event: FormEvent) {
    event.preventDefault();
    if (!categoryDraft) return;
    const displayOrder = Number(categoryDraft.displayOrder);
    const categoryId = categoryDraft.id;
    const updated = await mutate(
      () => updateDiscoveryCategory(categoryId, {
        name: categoryDraft.name.trim(),
        displayOrder,
        enabled: categoryDraft.enabled,
      }),
      categoryId,
      "카테고리를 수정했습니다.",
    );
    if (updated) setCategoryDraft(null);
  }

  async function removeCategory(category: DiscoveryCategory) {
    if (!window.confirm(`'${category.name}' 카테고리와 하위 키워드를 삭제할까요?`)) return;
    const removed = await mutate(() => deleteDiscoveryCategory(category.id), undefined, "카테고리를 삭제했습니다.");
    if (removed) {
      setCategoryDraft(null);
      setKeywordDraft(null);
    }
  }

  async function saveKeyword(event: FormEvent) {
    event.preventDefault();
    if (!keywordDraft || !selectedCategory) return;
    const categoryId = selectedCategory.id;
    const priority = Number(keywordDraft.priority);
    if (keywordDraft.id === null) {
      setSaving(true);
      setError("");
      setNotice("");
      try {
        const result = await createDiscoveryKeyword(categoryId, {
          keyword: keywordDraft.keyword.trim(),
          priority,
        });
        setKeywordDraft(null);
        await finishMutation(
          categoryId,
          result.warnings.length > 0 ? result.warnings.join(" ") : "키워드를 추가했습니다.",
        );
      } catch (reason) {
        setError(reasonMessage(reason, "키워드 생성에 실패했습니다."));
      } finally {
        setSaving(false);
      }
      return;
    }

    const keywordId = keywordDraft.id;
    const updated = await mutate(
      () => updateDiscoveryKeyword(categoryId, keywordId, {
        enabled: keywordDraft.enabled,
        priority,
      }),
      categoryId,
      "키워드를 수정했습니다.",
    );
    if (updated) setKeywordDraft(null);
  }

  async function removeKeyword(keyword: DiscoveryKeyword) {
    if (!selectedCategory || !window.confirm(`'${keyword.keyword}' 키워드를 삭제할까요?`)) return;
    const removed = await mutate(
      () => deleteDiscoveryKeyword(selectedCategory.id, keyword.id),
      selectedCategory.id,
      "키워드를 삭제했습니다.",
    );
    if (removed) setKeywordDraft(null);
  }

  return (
    <SidePanel onClose={onClose} title="발굴 카테고리·키워드 설정">
      <div className="fuma-detail-panel__content fuma-discovery-settings">
        {error ? <p className="fuma-discovery-settings__message fuma-discovery-settings__message--error" role="alert">{error}</p> : null}
        {notice ? <p className="fuma-discovery-settings__message" role="status">{notice}</p> : null}

        <div className="fuma-discovery-settings__workspace">
          <section className="fuma-discovery-settings__section fuma-discovery-settings__section--categories">
            <header>
              <span className="fuma-discovery-settings__step">1</span>
              <div className="fuma-discovery-settings__section-copy">
                <h3>카테고리</h3>
                <p>발굴할 크리에이터 분야를 선택하고 관리합니다.</p>
              </div>
            </header>

            {categoryDraft ? (
              <form className="fuma-discovery-settings__form" onSubmit={saveCategory}>
                <label>
                  <span>카테고리명</span>
                  <TextInput maxLength={50} onChange={(event) => setCategoryDraft({ ...categoryDraft, name: event.target.value })} required value={categoryDraft.name} />
                </label>
                <label>
                  <span>목록 순서</span>
                  <TextInput onChange={(event) => setCategoryDraft({ ...categoryDraft, displayOrder: event.target.value })} required type="number" value={categoryDraft.displayOrder} />
                </label>
                <Checkbox checked={categoryDraft.enabled} label="크리에이터 발굴에 사용" onChange={(event) => setCategoryDraft({ ...categoryDraft, enabled: event.target.checked })} />
                <div className="fuma-discovery-settings__form-actions">
                  <Button disabled={saving} type="submit" variant="primary">저장</Button>
                  <Button disabled={saving} onClick={() => setCategoryDraft(null)}>취소</Button>
                </div>
              </form>
            ) : null}

            {loading ? <p className="fuma-discovery-settings__empty">불러오는 중입니다.</p> : null}
            {!loading && categories.length === 0 ? <p className="fuma-discovery-settings__empty">등록된 카테고리가 없습니다.</p> : null}
            <ul className="fuma-discovery-settings__category-list">
              {categories.map((category) => (
                <li className={category.id === selectedId ? "is-selected" : undefined} key={category.id}>
                  <button
                    aria-pressed={category.id === selectedId}
                    className="fuma-discovery-settings__category-select"
                    onClick={() => { setSelectedId(category.id); setKeywordDraft(null); }}
                    type="button"
                  >
                    <span className="fuma-discovery-settings__category-copy">
                      <strong>{category.name}</strong>
                      <small>키워드 {category.keywords.length}개</small>
                    </span>
                    {!category.enabled ? <StatusPill tone="neutral">비활성</StatusPill> : null}
                  </button>
                  <div className="fuma-discovery-settings__row-actions">
                    <Button aria-label={`${category.name} 카테고리 수정`} disabled={saving} onClick={() => { setSelectedId(category.id); setCategoryDraft({ id: category.id, name: category.name, displayOrder: String(category.displayOrder), enabled: category.enabled }); }}>수정</Button>
                    <Button aria-label={`${category.name} 카테고리 삭제`} disabled={saving} onClick={() => removeCategory(category)} variant="danger">삭제</Button>
                  </div>
                </li>
              ))}
            </ul>
          </section>

          <section className="fuma-discovery-settings__section fuma-discovery-settings__section--keywords">
            <header>
              <span className="fuma-discovery-settings__step">2</span>
              <div className="fuma-discovery-settings__section-copy">
                <h3>{selectedCategory ? `${selectedCategory.name} 발굴 키워드` : "발굴 키워드"}</h3>
                <p>해당 분야의 크리에이터를 찾을 검색어를 관리합니다.</p>
              </div>
              <Button disabled={!selectedCategory || saving} onClick={() => setKeywordDraft(emptyKeywordDraft())} variant="primary">키워드 추가</Button>
            </header>

            {keywordDraft ? (
              <form className="fuma-discovery-settings__form" onSubmit={saveKeyword}>
                <label>
                  <span>검색할 키워드</span>
                  <TextInput disabled={keywordDraft.id !== null} maxLength={100} onChange={(event) => setKeywordDraft({ ...keywordDraft, keyword: event.target.value })} placeholder="예: 데일리 메이크업" required value={keywordDraft.keyword} />
                </label>
                <label>
                  <span>실행 우선순위</span>
                  <TextInput onChange={(event) => setKeywordDraft({ ...keywordDraft, priority: event.target.value })} required type="number" value={keywordDraft.priority} />
                  <small>숫자가 클수록 먼저 검색합니다.</small>
                </label>
                {keywordDraft.id !== null ? (
                  <Checkbox checked={keywordDraft.enabled} label="크리에이터 발굴에 사용" onChange={(event) => setKeywordDraft({ ...keywordDraft, enabled: event.target.checked })} />
                ) : null}
                <div className="fuma-discovery-settings__form-actions">
                  <Button disabled={saving} type="submit" variant="primary">저장</Button>
                  <Button disabled={saving} onClick={() => setKeywordDraft(null)}>취소</Button>
                </div>
              </form>
            ) : null}

            {!selectedCategory ? <p className="fuma-discovery-settings__empty">카테고리를 선택해 주세요.</p> : null}
            {selectedCategory && selectedCategory.keywords.length === 0 ? <p className="fuma-discovery-settings__empty">등록된 키워드가 없습니다.</p> : null}
            {selectedCategory ? (
              <ul className="fuma-discovery-settings__keyword-list">
                {selectedCategory.keywords.map((keyword) => (
                  <li key={keyword.id}>
                    <div className="fuma-discovery-settings__keyword-copy">
                      <strong>{keyword.keyword}</strong>
                      <span>실행 우선순위 {keyword.priority}</span>
                      {!keyword.enabled ? <StatusPill tone="neutral">비활성</StatusPill> : null}
                    </div>
                    <div className="fuma-discovery-settings__row-actions">
                      <Button aria-label={`${keyword.keyword} 키워드 수정`} disabled={saving} onClick={() => setKeywordDraft({ id: keyword.id, keyword: keyword.keyword, priority: String(keyword.priority), enabled: keyword.enabled })}>수정</Button>
                      <Button aria-label={`${keyword.keyword} 키워드 삭제`} disabled={saving} onClick={() => removeKeyword(keyword)} variant="danger">삭제</Button>
                    </div>
                  </li>
                ))}
              </ul>
            ) : null}
          </section>
        </div>
      </div>
    </SidePanel>
  );
}
