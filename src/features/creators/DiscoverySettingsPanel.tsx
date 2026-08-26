import { useEffect, useState, type FormEvent } from "react";
import { GripVertical, MoreHorizontal, Plus } from "lucide-react";
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
  keyword: string;
}

function reasonMessage(reason: unknown, fallback: string) {
  return reason instanceof Error ? reason.message : fallback;
}

function emptyKeywordDraft(): KeywordDraft {
  return { keyword: "" };
}

const RELOAD_ERROR = "변경사항은 저장됐지만 목록을 새로고침하지 못했습니다. 패널을 닫았다 다시 열어 주세요.";

export function DiscoverySettingsPanel({ onClose }: { onClose: () => void }) {
  const [categories, setCategories] = useState<DiscoveryCategory[]>([]);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [categoryDraft, setCategoryDraft] = useState<CategoryDraft | null>(null);
  const [keywordDraft, setKeywordDraft] = useState<KeywordDraft | null>(null);
  const [keywordEdits, setKeywordEdits] = useState<Record<number, string>>({});
  const [draggedKeywordId, setDraggedKeywordId] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const selectedCategory = categories.find((category) => category.id === selectedId) ?? null;

  async function reload(preferredId?: number) {
    const nextCategories = await getDiscoveryCategories();
    setCategories(nextCategories);
    setKeywordEdits({});
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
    const keyword = keywordDraft.keyword.trim();
    if (!keyword) return;
    const priority = Math.max(0, ...selectedCategory.keywords.map((item) => item.priority)) + 10;
    setSaving(true);
    setError("");
    setNotice("");
    try {
      const result = await createDiscoveryKeyword(categoryId, { keyword, priority });
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
  }

  async function renameKeyword(keyword: DiscoveryKeyword, value: string) {
    if (!selectedCategory) return;
    const nextKeyword = value.trim();
    if (!nextKeyword || nextKeyword === keyword.keyword) {
      setKeywordEdits((current) => {
        const next = { ...current };
        delete next[keyword.id];
        return next;
      });
      return;
    }

    setSaving(true);
    setError("");
    setNotice("");
    try {
      const created = await createDiscoveryKeyword(selectedCategory.id, {
        keyword: nextKeyword,
        priority: keyword.priority,
      });
      if (!keyword.enabled) {
        await updateDiscoveryKeyword(selectedCategory.id, created.keyword.id, {
          enabled: false,
          priority: keyword.priority,
        });
      }
      await deleteDiscoveryKeyword(selectedCategory.id, keyword.id);
      await finishMutation(selectedCategory.id, "키워드를 수정했습니다.");
    } catch (reason) {
      setError(reasonMessage(reason, "키워드 수정에 실패했습니다."));
    } finally {
      setSaving(false);
    }
  }

  async function reorderKeywords(targetId: number) {
    if (!selectedCategory || draggedKeywordId === null || draggedKeywordId === targetId) return;
    const original = selectedCategory.keywords;
    const fromIndex = original.findIndex((keyword) => keyword.id === draggedKeywordId);
    const toIndex = original.findIndex((keyword) => keyword.id === targetId);
    if (fromIndex < 0 || toIndex < 0) return;

    const reordered = [...original];
    const [moved] = reordered.splice(fromIndex, 1);
    reordered.splice(toIndex, 0, moved);
    setCategories((current) => current.map((category) => (
      category.id === selectedCategory.id ? { ...category, keywords: reordered } : category
    )));
    setDraggedKeywordId(null);
    setSaving(true);
    setError("");
    setNotice("");
    try {
      await Promise.all(reordered.map((keyword, index) => updateDiscoveryKeyword(
        selectedCategory.id,
        keyword.id,
        { enabled: keyword.enabled, priority: (reordered.length - index) * 10 },
      )));
      await finishMutation(selectedCategory.id, "키워드 순서를 변경했습니다.");
    } catch (reason) {
      setError(reasonMessage(reason, "키워드 순서 변경에 실패했습니다."));
      try { await reload(selectedCategory.id); } catch { setError(RELOAD_ERROR); }
    } finally {
      setSaving(false);
    }
  }

  return (
    <SidePanel onClose={onClose} title="크리에이터 발굴 키워드 설정">
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
                  <details className="fuma-discovery-settings__row-menu">
                    <summary aria-label={`${category.name} 카테고리 메뉴`}>
                      <MoreHorizontal aria-hidden="true" size={18} />
                    </summary>
                    <div>
                      <button
                        disabled={saving}
                        onClick={(event) => {
                          event.currentTarget.closest("details")?.removeAttribute("open");
                          setSelectedId(category.id);
                          setCategoryDraft({
                            id: category.id,
                            name: category.name,
                            displayOrder: String(category.displayOrder),
                            enabled: category.enabled,
                          });
                        }}
                        type="button"
                      >
                        수정
                      </button>
                      <button
                        className="is-danger"
                        disabled={saving}
                        onClick={(event) => {
                          event.currentTarget.closest("details")?.removeAttribute("open");
                          void removeCategory(category);
                        }}
                        type="button"
                      >
                        삭제
                      </button>
                    </div>
                  </details>
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
            </header>

            {!selectedCategory ? <p className="fuma-discovery-settings__empty">카테고리를 선택해 주세요.</p> : null}
            {selectedCategory ? (
              <>
                <div className="fuma-discovery-settings__keyword-list-toolbar">
                  <button
                    aria-label="키워드 추가"
                    disabled={saving || keywordDraft !== null}
                    onClick={() => setKeywordDraft(emptyKeywordDraft())}
                    type="button"
                  >
                    <Plus aria-hidden="true" size={17} />
                  </button>
                </div>
                <ul className="fuma-discovery-settings__keyword-list">
                  {keywordDraft ? (
                    <li className="is-new">
                      <form onSubmit={saveKeyword}>
                        <span aria-hidden="true" className="fuma-discovery-settings__drag-handle"><GripVertical size={17} /></span>
                        <TextInput
                          autoFocus
                          maxLength={100}
                          onBlur={(event) => {
                            if (!event.currentTarget.value.trim()) setKeywordDraft(null);
                          }}
                          onChange={(event) => setKeywordDraft({ ...keywordDraft, keyword: event.target.value })}
                          placeholder="새 키워드를 입력하고 Enter"
                          value={keywordDraft.keyword}
                        />
                      </form>
                    </li>
                  ) : null}
                  {selectedCategory.keywords.map((keyword) => (
                    <li
                      className={draggedKeywordId === keyword.id ? "is-dragging" : undefined}
                      key={keyword.id}
                      onDragOver={(event) => event.preventDefault()}
                      onDrop={() => void reorderKeywords(keyword.id)}
                    >
                      <span
                        aria-label={`${keyword.keyword} 순서 변경`}
                        className="fuma-discovery-settings__drag-handle"
                        draggable={!saving}
                        onDragEnd={() => setDraggedKeywordId(null)}
                        onDragStart={(event) => {
                          event.dataTransfer.effectAllowed = "move";
                          setDraggedKeywordId(keyword.id);
                        }}
                        role="img"
                      >
                        <GripVertical aria-hidden="true" size={17} />
                      </span>
                      <div className="fuma-discovery-settings__keyword-copy">
                        <TextInput
                          aria-label={`${keyword.keyword} 키워드`}
                          disabled={saving}
                          maxLength={100}
                          onBlur={(event) => void renameKeyword(keyword, event.currentTarget.value)}
                          onChange={(event) => setKeywordEdits((current) => ({
                            ...current,
                            [keyword.id]: event.target.value,
                          }))}
                          onKeyDown={(event) => {
                            if (event.key === "Enter") event.currentTarget.blur();
                            if (event.key === "Escape") {
                              event.preventDefault();
                              event.currentTarget.value = keyword.keyword;
                              setKeywordEdits((current) => {
                                const next = { ...current };
                                delete next[keyword.id];
                                return next;
                              });
                              event.currentTarget.blur();
                            }
                          }}
                          value={keywordEdits[keyword.id] ?? keyword.keyword}
                        />
                        {!keyword.enabled ? <StatusPill tone="neutral">비활성</StatusPill> : null}
                      </div>
                    </li>
                  ))}
                </ul>
                {selectedCategory.keywords.length === 0 && !keywordDraft ? (
                  <p className="fuma-discovery-settings__empty">등록된 키워드가 없습니다.</p>
                ) : null}
              </>
            ) : null}
          </section>
        </div>
      </div>
    </SidePanel>
  );
}
