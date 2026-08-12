import {
  useId,
  useState,
  type ChangeEvent,
  type FormEvent,
  type KeyboardEvent,
} from "react";
import { Link, useLocation, useNavigate, useParams, useSearchParams } from "react-router-dom";
import { PageHeader } from "../../components/shell/PageHeader";
import {
  Button,
  buttonClassNames,
  Checkbox,
  TextInput,
} from "../../components/ui/Controls";
import { DenseTable, type DenseTableColumn } from "../../components/ui/DenseTable";
import { EmptyState } from "../../components/ui/EmptyState";
import { FilterField } from "../../components/ui/FilterField";
import { FormRow } from "../../components/ui/FormRow";
import { Modal } from "../../components/ui/Modal";
import { Pagination } from "../../components/ui/Pagination";
import { SearchActions } from "../../components/ui/SearchActions";
import { SearchPanel } from "../../components/ui/SearchPanel";
import { SidePanel } from "../../components/ui/SidePanel";
import { StatusPill, type StatusPillProps } from "../../components/ui/StatusPill";
import { paginate } from "../../lib/pagination";
import { assetUrl } from "../creators/assetUrl";
import { PlatformIcon } from "../../components/social/PlatformIcon";
import { CREATORS, type CreatorFixture } from "../creators/fixtures";
import { CONTENT_INFLUENCE } from "../performance/fixtures";
import {
  CAMPAIGNS,
  CAMPAIGN_PRODUCTS,
  findCampaignFixture,
  type CampaignFixture,
  type CampaignProduct,
  type CampaignStatus,
} from "./fixtures";

const CAMPAIGN_STATUS_CATEGORIES: CampaignStatus[] = ["시작 전", "진행 중", "종료"];
const CAMPAIGN_PAGE_SIZE = 20;

function statusTone(status: CampaignStatus): NonNullable<StatusPillProps["tone"]> {
  if (status === "시작 전") {
    return "pending";
  }
  if (status === "진행 중") {
    return "approved";
  }
  return "neutral";
}

function saleStatusTone(
  status: CampaignProduct["saleStatus"],
): NonNullable<StatusPillProps["tone"]> {
  if (status === "판매중") return "approved";
  if (status === "품절") return "rejected";
  return "neutral";
}

function CampaignThumbnail({ campaign }: { campaign: CampaignFixture }) {
  return (
    <img
      alt={`${campaign.name} 썸네일`}
      className="fuma-campaign-thumbnail"
      src={assetUrl(campaign.thumbnailUrl)}
    />
  );
}

const CAMPAIGN_COLUMNS: DenseTableColumn<CampaignFixture>[] = [
  {
    id: "campaign",
    header: "캠페인",
    width: 390,
    render: (campaign) => (
      <div className="fuma-campaign-list-identity">
        <CampaignThumbnail campaign={campaign} />
        <div>
          <strong>{campaign.name}</strong>
          <span>{campaign.id}</span>
        </div>
      </div>
    ),
  },
  {
    id: "period",
    header: "캠페인 진행 기간",
    width: 230,
    align: "center",
    render: (campaign) => (
      <div className="fuma-campaign-list-period">
        <span>{campaign.startDate}</span>
        <i aria-hidden="true">~</i>
        <span>{campaign.endDate}</span>
      </div>
    ),
  },
  {
    id: "productCount",
    header: "해당 상품",
    width: 92,
    align: "center",
    render: (campaign) => `${campaign.products.length}개`,
  },
  {
    key: "status",
    header: "상태",
    width: 88,
    align: "center",
    render: (campaign) => (
      <StatusPill tone={statusTone(campaign.status)}>{campaign.status}</StatusPill>
    ),
  },
];

export function CampaignListPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const detailCampaignId = searchParams.get("detail");
  const [keyword, setKeyword] = useState("");
  const [periodStart, setPeriodStart] = useState("");
  const [periodEnd, setPeriodEnd] = useState("");
  const [appliedKeyword, setAppliedKeyword] = useState("");
  const [appliedPeriodStart, setAppliedPeriodStart] = useState("");
  const [appliedPeriodEnd, setAppliedPeriodEnd] = useState("");
  const [selectedStatus, setSelectedStatus] = useState<CampaignStatus | null>(null);
  const filteredCampaigns = CAMPAIGNS.filter((campaign) => (
    (!appliedKeyword || [campaign.name, campaign.id].some((value) => (
      value.toLowerCase().includes(appliedKeyword.toLowerCase())
    )))
    && (!appliedPeriodStart || campaign.endDate >= appliedPeriodStart)
    && (!appliedPeriodEnd || campaign.startDate <= appliedPeriodEnd)
    && (!selectedStatus || campaign.status === selectedStatus)
  ));
  const requestedPage = Number.parseInt(searchParams.get("page") ?? "1", 10);
  const { currentPage, pagedItems: campaigns, totalPages } = paginate(
    filteredCampaigns,
    requestedPage,
    CAMPAIGN_PAGE_SIZE,
  );

  const resetPage = () => {
    if (!searchParams.has("page")) return;
    const nextParams = new URLSearchParams(searchParams);
    nextParams.delete("page");
    setSearchParams(nextParams, { replace: true });
  };

  const applySearch = () => {
    setAppliedKeyword(keyword);
    setAppliedPeriodStart(periodStart);
    setAppliedPeriodEnd(periodEnd);
    resetPage();
  };

  const applySearchOnEnter = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "Enter") {
      event.preventDefault();
      applySearch();
    }
  };

  const resetSearch = () => {
    setKeyword("");
    setPeriodStart("");
    setPeriodEnd("");
    setAppliedKeyword("");
    setAppliedPeriodStart("");
    setAppliedPeriodEnd("");
    setSelectedStatus(null);
    resetPage();
  };

  const selectStatus = (status: CampaignStatus | null) => {
    setSelectedStatus(status);
    resetPage();
  };

  const openDetail = (campaignId: string) => {
    const nextParams = new URLSearchParams(searchParams);
    nextParams.set("detail", campaignId);
    setSearchParams(nextParams);
  };

  const closeDetail = () => {
    const nextParams = new URLSearchParams(searchParams);
    nextParams.delete("detail");
    setSearchParams(nextParams);
  };

  return (
    <>
    <section className="fuma-page">
      <PageHeader screenCode="CP101" title="캠페인 관리" />
      <div className="fuma-page__body">
        <div className="fuma-operations-search fuma-settlement-search fuma-campaign-search">
          <SearchPanel actions={<SearchActions onReset={resetSearch} onSearch={applySearch} />}>
            <FilterField htmlFor="campaign-keyword" label="검색어">
              <TextInput
                aria-label="검색어"
                id="campaign-keyword"
                onChange={(event) => setKeyword(event.target.value)}
                onKeyDown={applySearchOnEnter}
                placeholder="캠페인명 또는 ID 검색"
                value={keyword}
              />
            </FilterField>
            <div className="fuma-campaign-period-filter">
              <FilterField htmlFor="campaign-start-date" label="진행 시작">
                <TextInput aria-label="진행 시작일" id="campaign-start-date" max={periodEnd || undefined} onChange={(event) => setPeriodStart(event.target.value)} type="date" value={periodStart} />
              </FilterField>
              <FilterField htmlFor="campaign-end-date" label="진행 종료">
                <TextInput aria-label="진행 종료일" id="campaign-end-date" min={periodStart || undefined} onChange={(event) => setPeriodEnd(event.target.value)} type="date" value={periodEnd} />
              </FilterField>
            </div>
          </SearchPanel>
        </div>
        <nav aria-label="캠페인 상태" className="fuma-creator-category-filter fuma-campaign-status-tabs">
          <div>
            <button
              aria-pressed={selectedStatus === null}
              className="fuma-creator-category-filter__option"
              onClick={() => selectStatus(null)}
              type="button"
            >
              전체
            </button>
            {CAMPAIGN_STATUS_CATEGORIES.map((status) => (
              <button
                aria-pressed={selectedStatus === status}
                className="fuma-creator-category-filter__option"
                key={status}
                onClick={() => selectStatus(status)}
                type="button"
              >
                {status}
              </button>
            ))}
          </div>
        </nav>
        <div className="fuma-result-toolbar fuma-simple-result-toolbar fuma-campaign-result-toolbar">
          <strong>캠페인 목록</strong>
          <div className="fuma-settlement-result-meta">
            <span>{selectedStatus ?? "전체"}</span>
            <span>총 {filteredCampaigns.length}건</span>
          </div>
          <Link
            className={buttonClassNames("primary", "fuma-result-toolbar__link")}
            to="/campaigns/new"
          >
            캠페인 생성
          </Link>
        </div>
        <div
          aria-label="캠페인 목록"
          className="fuma-wide-table fuma-settlement-table fuma-campaign-list-table"
          role="region"
        >
          <DenseTable
            columns={CAMPAIGN_COLUMNS}
            onRowClick={(campaign) => openDetail(campaign.id)}
            rowKey={(campaign) => campaign.id}
            rows={campaigns}
          />
        </div>
        <Pagination
          onPageChange={(page) => {
            const nextParams = new URLSearchParams(searchParams);
            if (page === 1) nextParams.delete("page");
            else nextParams.set("page", String(page));
            setSearchParams(nextParams, { replace: true });
          }}
          page={currentPage}
          pageSize={CAMPAIGN_PAGE_SIZE}
          totalPages={totalPages}
        />
      </div>
    </section>
    {detailCampaignId ? (
      <CampaignDetailPage
        campaignIdOverride={detailCampaignId}
        embedded
        onClose={closeDetail}
      />
    ) : null}
    </>
  );
}

interface CampaignFormProps {
  campaign?: CampaignFixture;
  formId: string;
  mode: "create" | "edit";
  onSubmit: () => void;
}

function selectedProductColumns(
  onRemove: (productId: string) => void,
): DenseTableColumn<CampaignProduct>[] {
  return [
    { key: "id", header: "상품코드", width: 118 },
    { key: "name", header: "상품명" },
    {
      id: "saleStatus",
      header: "판매 상태",
      width: 88,
      align: "center",
      render: (product) => (
        <StatusPill tone={saleStatusTone(product.saleStatus)}>
          {product.saleStatus}
        </StatusPill>
      ),
    },
    {
      id: "delete",
      header: "관리",
      width: 70,
      align: "center",
      render: (product) => (
        <Button
          aria-label={`${product.name} 삭제`}
          className="fuma-table-action"
          onClick={() => onRemove(product.id)}
          variant="danger"
        >
          제거
        </Button>
      ),
    },
  ];
}

function CampaignForm({ campaign, formId, mode, onSubmit }: CampaignFormProps) {
  const [searchParams] = useSearchParams();
  const [isProductModalOpen, setProductModalOpen] = useState(
    mode === "create" && searchParams.get("fixture") === "product-modal",
  );
  const [products, setProducts] = useState<CampaignProduct[]>(
    campaign ? [...campaign.products] : [],
  );
  const [thumbnailPreview, setThumbnailPreview] = useState(
    campaign ? assetUrl(campaign.thumbnailUrl) : "",
  );

  function handleThumbnailChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) {
      return;
    }

    const reader = new FileReader();
    reader.addEventListener("load", () => {
      if (typeof reader.result === "string") {
        setThumbnailPreview(reader.result);
      }
    });
    reader.readAsDataURL(file);
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    onSubmit();
  }

  return (
    <form className="fuma-campaign-editor" id={formId} onSubmit={handleSubmit}>
      <header className="fuma-campaign-editor__intro">
        <div>
          <strong>{mode === "create" ? "새 캠페인 정보" : campaign?.name}</strong>
          <span>캠페인명, 진행 기간, 썸네일과 해당 상품을 설정합니다.</span>
        </div>
        {campaign ? (
          <div className="fuma-campaign-editor__meta">
            <span>{campaign.id}</span>
            <StatusPill tone={statusTone(campaign.status)}>{campaign.status}</StatusPill>
          </div>
        ) : null}
      </header>

      <div className="fuma-campaign-editor__layout">
        <label className="fuma-campaign-thumbnail-upload">
          <span className="fuma-campaign-thumbnail-upload__label">캠페인 썸네일</span>
          <span className="fuma-campaign-thumbnail-upload__preview">
            {thumbnailPreview ? (
              <img alt="선택한 캠페인 썸네일 미리보기" src={thumbnailPreview} />
            ) : (
              <span>
                <strong>이미지 추가</strong>
                <small>16:9 비율 권장</small>
              </span>
            )}
          </span>
          <input accept="image/*" onChange={handleThumbnailChange} type="file" />
          <span className="fuma-campaign-thumbnail-upload__action">
            {thumbnailPreview ? "이미지 변경" : "이미지 선택"}
          </span>
        </label>

        <section className="fuma-campaign-form-section">
          <header>
            <h3>기본 정보</h3>
          </header>
          <div className="fuma-campaign-form">
            <FormRow label="캠페인명" required>
              <TextInput
                aria-label="캠페인명"
                className="fuma-campaign-name-input"
                defaultValue={campaign?.name ?? ""}
                placeholder="캠페인명을 입력하세요"
                required
              />
            </FormRow>
            <FormRow label="진행 기간" required>
              <div className="fuma-campaign-date-range">
                <TextInput
                  aria-label="시작일"
                  defaultValue={campaign?.startDate ?? ""}
                  required
                  type="date"
                />
                <span aria-hidden="true">~</span>
                <TextInput
                  aria-label="종료일"
                  defaultValue={campaign?.endDate ?? ""}
                  required
                  type="date"
                />
              </div>
            </FormRow>
          </div>
        </section>
      </div>

      <section
        aria-labelledby="campaign-selected-products-title"
        className="fuma-campaign-selected-products"
      >
        <header>
          <div>
            <h3 id="campaign-selected-products-title">해당 상품</h3>
            <span>선택한 상품 {products.length}개</span>
          </div>
          <Button onClick={() => setProductModalOpen(true)} variant="primary">
            상품 선택
          </Button>
        </header>
        <div aria-label="선택 상품" role="region">
          <DenseTable
            columns={selectedProductColumns((productId) => {
              setProducts((current) => current.filter((product) => product.id !== productId));
            })}
            emptyMessage="아직 선택한 상품이 없습니다."
            rowKey={(product) => product.id}
            rows={products}
          />
        </div>
      </section>

      {isProductModalOpen ? (
        <ProductSearchModal
          onClose={() => setProductModalOpen(false)}
          onConfirm={(selectedProducts) => {
            setProducts(selectedProducts);
            setProductModalOpen(false);
          }}
          selectedProductIds={products.map((product) => product.id)}
        />
      ) : null}
    </form>
  );
}

interface CampaignEditorModalProps {
  campaign?: CampaignFixture;
  mode: "create" | "edit";
  onClose: () => void;
}

function CampaignEditorModal({ campaign, mode, onClose }: CampaignEditorModalProps) {
  const formId = useId();

  return (
    <Modal
      actions={
        <>
          <Button onClick={onClose}>취소</Button>
          <Button form={formId} type="submit" variant="primary">
            {mode === "create" ? "캠페인 생성" : "저장"}
          </Button>
        </>
      }
      onClose={onClose}
      open
      title={mode === "create" ? "새 캠페인 생성" : "캠페인 수정"}
    >
      <CampaignForm
        campaign={campaign}
        formId={formId}
        key={campaign?.id ?? "new"}
        mode={mode}
        onSubmit={onClose}
      />
    </Modal>
  );
}

export function CampaignCreatePage() {
  const navigate = useNavigate();

  return (
    <>
      <CampaignListPage />
      <CampaignEditorModal mode="create" onClose={() => navigate("/campaigns")} />
    </>
  );
}

export function CampaignEditPage() {
  const { campaignId } = useParams();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const campaign = findCampaignFixture(campaignId);
  const openedFromList = searchParams.get("from") === "list";
  const closePath = openedFromList || !campaign ? "/campaigns" : `/campaigns/${campaign.id}`;

  return (
    <>
      <CampaignListPage />
      {campaign ? (
        <CampaignEditorModal
          campaign={campaign}
          mode="edit"
          onClose={() => navigate(closePath)}
        />
      ) : (
        <Modal
          actions={<Button onClick={() => navigate("/campaigns")}>목록으로</Button>}
          onClose={() => navigate("/campaigns")}
          open
          title="캠페인 수정"
        >
          <EmptyState
            description="요청한 캠페인 정보를 확인할 수 없습니다."
            title="대상을 찾을 수 없습니다"
          />
        </Modal>
      )}
    </>
  );
}

const CAMPAIGN_DETAIL_PRODUCT_COLUMNS: DenseTableColumn<CampaignProduct>[] = [
  { key: "id", header: "상품코드", width: 118, align: "center" },
  { key: "name", header: "상품명" },
  {
    id: "saleStatus",
    header: "판매 상태",
    width: 92,
    align: "center",
    render: (product) => (
      <StatusPill tone={saleStatusTone(product.saleStatus)}>
        {product.saleStatus}
      </StatusPill>
    ),
  },
];

interface CampaignParticipantRow {
  creator: CreatorFixture;
  selectorId: string;
}

const CAMPAIGN_PARTICIPANT_COLUMNS: DenseTableColumn<CampaignParticipantRow>[] = [
  {
    id: "selectorId",
    header: "셀렉터스 ID",
    width: 130,
    align: "center",
    render: ({ selectorId }) => selectorId,
  },
  {
    id: "creatorName",
    header: "이름",
    width: 120,
    align: "center",
    render: ({ creator }) => creator.name,
  },
  {
    id: "platform",
    header: "플랫폼",
    width: 140,
    align: "center",
    render: ({ creator }) => (
      <span className="fuma-platform-label">
        <PlatformIcon platform={creator.profile.platform} />
        <span>{creator.profile.platform}</span>
      </span>
    ),
  },
  {
    id: "account",
    header: "계정",
    align: "center",
    render: ({ creator }) => creator.profile.handle,
  },
];

interface CampaignDetailPageProps {
  campaignIdOverride?: string;
  embedded?: boolean;
  onClose?: () => void;
}

export function CampaignDetailPage({
  campaignIdOverride,
  embedded = false,
  onClose,
}: CampaignDetailPageProps = {}) {
  const { hash } = useLocation();
  const { campaignId: routeCampaignId } = useParams();
  const navigate = useNavigate();
  const campaignId = campaignIdOverride ?? routeCampaignId;
  const campaign = findCampaignFixture(campaignId);
  const closePanel = onClose ?? (() => navigate("/campaigns"));
  const [activeDetailTab, setActiveDetailTab] = useState<"participants" | "products">(
    hash === "#campaign-products"
      ? "products"
      : "participants",
  );
  const participantRows: CampaignParticipantRow[] = campaign
    ? CONTENT_INFLUENCE.filter((content) => content.campaignId === campaign.id).reduce<CampaignParticipantRow[]>((rows, content) => {
      const creator = CREATORS.find((item) => item.id === content.creatorId);
      if (!creator) {
        return rows;
      }

      const existingRow = rows.find((row) => row.creator.id === creator.id);
      if (existingRow) {
        return rows;
      }

      rows.push({ creator, selectorId: content.selectorId });
      return rows;
    }, [])
    : [];
  return (
    <>
      {embedded ? null : <CampaignListPage />}
      <SidePanel
        actions={campaign ? (
          <Link
            aria-label="캠페인 수정"
            className="hsas-button hsas-button--primary"
            to={`/campaigns/${campaign.id}/edit`}
          >
            수정
          </Link>
        ) : null}
        onClose={closePanel}
        title="캠페인 상세"
      >
        <div className="fuma-detail-panel__content fuma-campaign-detail-panel">
        {campaign ? (
          <div className="fuma-campaign-detail fuma-campaign-detail--feed">
            <section aria-label="기본 정보" className="fuma-campaign-detail-overview">
              <figure className="fuma-campaign-detail-preview">
                <CampaignThumbnail campaign={campaign} />
              </figure>
              <div className="fuma-campaign-detail-overview__info">
                <header>
                  <div>
                    <span>캠페인</span>
                    <h2>{campaign.name}</h2>
                  </div>
                  <div>
                    <StatusPill tone={statusTone(campaign.status)}>{campaign.status}</StatusPill>
                  </div>
                </header>
                <dl>
                  <div><dt>캠페인 ID</dt><dd>{campaign.id}</dd></div>
                  <div><dt>캠페인 진행 기간</dt><dd>{campaign.startDate} ~ {campaign.endDate}</dd></div>
                  <div><dt>포함 상품</dt><dd>{campaign.products.length}개</dd></div>
                </dl>
              </div>
            </section>

            <nav aria-label="캠페인 상세 메뉴" className="fuma-creator-category-filter fuma-campaign-detail-tabs">
              <div>
                <button
                  aria-pressed={activeDetailTab === "participants"}
                  className="fuma-creator-category-filter__option"
                  onClick={() => setActiveDetailTab("participants")}
                  type="button"
                >
                  참여 셀렉터스
                </button>
                <button
                  aria-pressed={activeDetailTab === "products"}
                  className="fuma-creator-category-filter__option"
                  onClick={() => setActiveDetailTab("products")}
                  type="button"
                >
                  포함 상품
                </button>
              </div>
            </nav>

            <div className="fuma-result-toolbar fuma-simple-result-toolbar fuma-campaign-detail-list-toolbar">
              <strong>{activeDetailTab === "participants" ? "셀렉터스 목록" : "포함 상품 목록"}</strong>
              <div className="fuma-settlement-result-meta">
                <span>총 {activeDetailTab === "participants" ? participantRows.length : campaign.products.length}건</span>
              </div>
            </div>

            {activeDetailTab === "participants" ? (
              <div
                aria-label="참여 셀렉터스"
                className="fuma-wide-table fuma-settlement-table fuma-selector-list-table fuma-campaign-participant-table"
                id="campaign-participants"
                role="region"
              >
                <DenseTable
                  columns={CAMPAIGN_PARTICIPANT_COLUMNS}
                    emptyMessage="참여 셀렉터스가 없습니다."
                  rowKey={({ creator }) => creator.id}
                  rows={participantRows}
                />
              </div>
            ) : null}

            {activeDetailTab === "products" ? (
              <div
                aria-label="포함 상품"
                className="fuma-wide-table fuma-settlement-table fuma-selector-list-table fuma-campaign-product-table"
                id="campaign-products"
                role="region"
              >
                <DenseTable
                  columns={CAMPAIGN_DETAIL_PRODUCT_COLUMNS}
                  rowKey={(product) => product.id}
                  rows={[...campaign.products]}
                />
              </div>
            ) : null}
          </div>
        ) : (
          <EmptyState
            description="요청한 캠페인 정보를 확인할 수 없습니다."
            title="대상을 찾을 수 없습니다"
          />
        )}
        </div>
      </SidePanel>
    </>
  );
}

function ProductSearchModal({
  onClose,
  onConfirm,
  selectedProductIds,
}: {
  onClose: () => void;
  onConfirm: (products: CampaignProduct[]) => void;
  selectedProductIds: string[];
}) {
  const [query, setQuery] = useState("");
  const [draftProductIds, setDraftProductIds] = useState<Set<string>>(
    () => new Set(selectedProductIds),
  );

  const normalizedQuery = query.trim().toLowerCase();
  const products = CAMPAIGN_PRODUCTS.filter((product) => (
    !normalizedQuery
      || product.id.toLowerCase().includes(normalizedQuery)
      || product.name.toLowerCase().includes(normalizedQuery)
  ));
  const columns: DenseTableColumn<CampaignProduct>[] = [
    {
      id: "selection",
      header: "선택",
      width: 52,
      align: "center",
      render: (product) => (
        <Checkbox
          checked={draftProductIds.has(product.id)}
          label={<span className="hsas-visually-hidden">{product.name} 선택</span>}
          onChange={() => {
            setDraftProductIds((current) => {
              const next = new Set(current);
              if (next.has(product.id)) {
                next.delete(product.id);
              } else {
                next.add(product.id);
              }
              return next;
            });
          }}
        />
      ),
    },
    { key: "id", header: "상품코드", width: 118 },
    { key: "name", header: "상품명" },
    {
      id: "saleStatus",
      header: "판매 상태",
      width: 90,
      align: "center",
      render: (product) => (
        <StatusPill tone={saleStatusTone(product.saleStatus)}>
          {product.saleStatus}
        </StatusPill>
      ),
    },
  ];

  return (
    <Modal
      actions={
        <>
          <Button onClick={onClose}>취소</Button>
          <Button
            onClick={() => {
              onConfirm(CAMPAIGN_PRODUCTS.filter((product) => draftProductIds.has(product.id)));
            }}
            variant="primary"
          >
            선택 완료 ({draftProductIds.size})
          </Button>
        </>
      }
      className="fuma-campaign-product-picker-modal"
      onClose={onClose}
      open
      title="해당 상품 선택"
    >
      <div className="fuma-campaign-product-modal">
        <div className="fuma-campaign-product-picker__search">
          <FilterField htmlFor="campaign-product-query" label="상품 검색">
            <TextInput
              aria-label="상품 검색"
              id="campaign-product-query"
              onChange={(event) => setQuery(event.target.value)}
              placeholder="상품명 또는 상품코드"
              value={query}
            />
          </FilterField>
          <span>총 {products.length}개 상품</span>
        </div>
        <div
          aria-label="상품 목록"
          className="fuma-campaign-modal-table"
          role="region"
        >
          <DenseTable
            columns={columns}
            rowKey={(row) => row.id}
            rows={products}
          />
        </div>
      </div>
    </Modal>
  );
}
