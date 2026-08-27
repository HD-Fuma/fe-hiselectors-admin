import {
  useId,
  useEffect,
  useMemo,
  useRef,
  useState,
  type FormEvent,
  type KeyboardEvent,
} from "react";
import { Link, useLocation, useNavigate, useParams, useSearchParams } from "react-router-dom";
import "../../styles/content-inspection.css";
import { PageHeader } from "../../components/shell/PageHeader";
import {
  Button,
  buttonClassNames,
  Checkbox,
  TextInput,
} from "../../components/ui/Controls";
import { ChoiceTabs } from "../../components/ui/ChoiceTabs";
import { ContentCollectionCard } from "../../components/ui/ContentCollectionCard";
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
import { ViewModeToggle, type ViewMode } from "../../components/ui/ViewModeToggle";
import { assetUrl } from "../../lib/assetUrl";
import { PlatformIcon } from "../../components/social/PlatformIcon";
import {
  CAMPAIGN_STATUS_OPTIONS,
  campaignStatusLabel,
  createCampaign,
  deleteCampaign,
  getCampaign,
  getCampaignParticipants,
  getCampaigns,
  getProducts,
  productStatusLabel,
  uploadCampaignThumbnail,
  updateCampaign,
  type Campaign,
  type CampaignParticipant,
  type CampaignProduct,
  type CampaignSaveRequest,
  type CampaignStatusCode,
  type CampaignUpdateRequest,
  type SpringPage,
} from "../../entities/campaign";

const CAMPAIGN_STATUS_CATEGORIES = CAMPAIGN_STATUS_OPTIONS;
const CAMPAIGN_PAGE_SIZE = 20;
const CAMPAIGN_DETAIL_PRODUCT_BATCH_SIZE = 10;
const CAMPAIGN_THUMBNAIL_MAX_BYTES = 5 * 1024 * 1024;
const CAMPAIGN_THUMBNAIL_TYPES = new Set(["image/jpeg", "image/png", "image/webp"]);

function statusTone(status: CampaignStatusCode): NonNullable<StatusPillProps["tone"]> {
  if (status === "SCHEDULED") {
    return "pending";
  }
  if (status === "ACTIVE") {
    return "approved";
  }
  return "neutral";
}

function saleStatusTone(
  status: CampaignProduct["status"],
): NonNullable<StatusPillProps["tone"]> {
  if (status === "ON_SALE") return "approved";
  if (status === "SOLD_OUT") return "rejected";
  return "neutral";
}

function CampaignThumbnail({ campaign }: { campaign: Campaign }) {
  return (
    <img
      alt={`${campaign.title} 썸네일`}
      className="fuma-campaign-thumbnail"
      onError={(event) => { event.currentTarget.onerror = null; event.currentTarget.src = assetUrl("/brand/thehyundai-hi.svg"); }}
      src={campaign.thumbnailUrl || assetUrl("/brand/thehyundai-hi.svg")}
    />
  );
}

function CampaignCard({ campaign, onOpen }: {
  campaign: Campaign;
  onOpen: (campaignId: number) => void;
}) {
  return (
    <button
      aria-label={`${campaign.title} 캠페인 상세 보기`}
      className="fuma-content-collection__card fuma-creator-card fuma-campaign-card"
      data-content-format="instagram-image"
      onClick={() => onOpen(campaign.id)}
      type="button"
    >
      <ContentCollectionCard
        header={null}
        mediaAlt={`${campaign.title} 썸네일`}
        mediaFallbackUrl="/brand/thehyundai-hi.svg"
        mediaOverlay={(
          <>
            <header className="fuma-campaign-card__status">
              <StatusPill tone={statusTone(campaign.status)}>
                {campaignStatusLabel(campaign.status)}
              </StatusPill>
            </header>
            <div className="fuma-campaign-card__overlay">
              <strong className="fuma-campaign-card__title">{campaign.title}</strong>
              <p className="fuma-campaign-card__period">
                <time dateTime={campaign.startDate}>{campaign.startDate}</time>
                {" ~ "}
                <time dateTime={campaign.endDate}>{campaign.endDate}</time>
              </p>
            </div>
          </>
        )}
        mediaUrl={campaign.thumbnailUrl || "/brand/thehyundai-hi.svg"}
        variant="custom"
      />
    </button>
  );
}

function CampaignProductIdentity({ product }: { product: CampaignProduct }) {
  const productName = product.productName || product.code || String(product.id);
  return (
    <div className="fuma-campaign-product-identity">
      <img
        alt={`${productName} 썸네일`}
        onError={(event) => { event.currentTarget.onerror = null; event.currentTarget.src = assetUrl("/brand/thehyundai-hi.svg"); }}
        src={product.thumbnailUrl || assetUrl("/brand/thehyundai-hi.svg")}
      />
      <span>{product.productName || "-"}</span>
    </div>
  );
}

const CAMPAIGN_COLUMNS: DenseTableColumn<Campaign>[] = [
  {
    id: "campaign",
    header: "캠페인",
    width: 390,
    render: (campaign) => (
      <div className="fuma-campaign-list-identity">
        <CampaignThumbnail campaign={campaign} />
        <div>
          <strong>{campaign.title}</strong>
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
    render: (campaign) => `${campaign.productIds.length}개`,
  },
  {
    key: "status",
    header: "상태",
    width: 88,
    align: "center",
    render: (campaign) => (
      <StatusPill tone={statusTone(campaign.status)}>{campaignStatusLabel(campaign.status)}</StatusPill>
    ),
  },
];

export function CampaignListPage({ refreshRevision = 0 }: { refreshRevision?: number } = {}) {
  const [searchParams, setSearchParams] = useSearchParams();
  const detailCampaignId = searchParams.get("detail");
  const [keyword, setKeyword] = useState("");
  const [periodStart, setPeriodStart] = useState("");
  const [periodEnd, setPeriodEnd] = useState("");
  const [appliedFilters, setAppliedFilters] = useState({ keyword: "", startDate: "", endDate: "" });
  const [selectedStatus, setSelectedStatus] = useState<CampaignStatusCode | null>(null);
  const [pageSize, setPageSize] = useState(CAMPAIGN_PAGE_SIZE);
  const [pageData, setPageData] = useState<SpringPage<Campaign> | null>(null);
  const [listError, setListError] = useState("");
  const currentPage = Math.max(1, Number.parseInt(searchParams.get("page") ?? "1", 10) || 1);
  const viewMode: ViewMode = searchParams.get("view") === "list" ? "list" : "grid";
  const campaigns = pageData?.content ?? [];

  useEffect(() => {
    const controller = new AbortController();
    getCampaigns({
      keyword: appliedFilters.keyword || undefined,
      startDate: appliedFilters.startDate || undefined,
      endDate: appliedFilters.endDate || undefined,
      status: selectedStatus || undefined,
      page: currentPage - 1,
      size: pageSize,
    }, controller.signal).then(setPageData).catch((reason: unknown) => {
      if (!controller.signal.aborted) setListError(reason instanceof Error ? reason.message : "캠페인 목록 조회에 실패했습니다.");
    });
    return () => controller.abort();
  }, [appliedFilters, currentPage, pageSize, refreshRevision, selectedStatus]);

  const resetPage = () => {
    if (!searchParams.has("page")) return;
    const nextParams = new URLSearchParams(searchParams);
    nextParams.delete("page");
    setSearchParams(nextParams, { replace: true });
  };

  const applySearch = () => {
    setAppliedFilters({ keyword: keyword.trim(), startDate: periodStart, endDate: periodEnd });
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
    setAppliedFilters({ keyword: "", startDate: "", endDate: "" });
    setSelectedStatus(null);
    resetPage();
  };

  const selectStatus = (status: CampaignStatusCode | null) => {
    setSelectedStatus(status);
    resetPage();
  };

  const openDetail = (campaignId: number) => {
    const nextParams = new URLSearchParams(searchParams);
    nextParams.set("detail", String(campaignId));
    setSearchParams(nextParams);
  };

  const closeDetail = () => {
    const nextParams = new URLSearchParams(searchParams);
    nextParams.delete("detail");
    setSearchParams(nextParams);
  };

  const changeViewMode = (nextViewMode: ViewMode) => {
    const nextParams = new URLSearchParams(searchParams);
    if (nextViewMode === "grid") nextParams.delete("view");
    else nextParams.set("view", nextViewMode);
    setSearchParams(nextParams, { replace: true });
  };

  return (
    <>
    <section className="fuma-page">
      <PageHeader title="캠페인 관리" />
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
        <ChoiceTabs
          actions={(
            <Link
              className={buttonClassNames("primary", "fuma-result-toolbar__link")}
              to="/campaigns/new"
            >
              캠페인 생성
            </Link>
          )}
          ariaLabel="캠페인 상태"
          className="fuma-campaign-status-tabs fuma-list-action-toolbar"
          emptyOption={{ label: "전체", onSelect: () => selectStatus(null) }}
          onChange={selectStatus}
          options={CAMPAIGN_STATUS_CATEGORIES}
          value={selectedStatus}
        />
        <section aria-label="캠페인 목록" className="fuma-content-collection">
          <div className="fuma-result-toolbar fuma-simple-result-toolbar fuma-applicant-result-toolbar fuma-campaign-result-toolbar">
            <strong>캠페인 목록</strong>
            <div className="fuma-settlement-result-meta">
              <span>{selectedStatus ? campaignStatusLabel(selectedStatus) : "전체"}</span>
              <span>총 {pageData?.totalElements ?? 0}건</span>
            </div>
            <div className="fuma-creator-toolbar fuma-creator-toolbar__controls">
              <span aria-hidden="true" className="fuma-creator-toolbar__divider" />
              <ViewModeToggle onChange={changeViewMode} value={viewMode} />
            </div>
          </div>
          {listError ? (
            <EmptyState description={listError} title="목록을 불러오지 못했습니다" />
          ) : !pageData ? (
            <EmptyState title="캠페인을 불러오는 중입니다." />
          ) : campaigns.length === 0 ? (
            <EmptyState title="캠페인이 없습니다." />
          ) : (
            <>
              <div className="fuma-content-collection__track is-grid" hidden={viewMode !== "grid"}>
                {campaigns.map((campaign) => (
                  <CampaignCard campaign={campaign} key={campaign.id} onOpen={openDetail} />
                ))}
              </div>
              <div
                aria-label="캠페인 리스트"
                className="fuma-wide-table fuma-content-collection__list fuma-campaign-list-table"
                hidden={viewMode !== "list"}
                role="region"
              >
                <DenseTable
                  columns={CAMPAIGN_COLUMNS}
                  onRowClick={(campaign) => openDetail(campaign.id)}
                  rowKey={(campaign) => campaign.id}
                  rows={campaigns}
                />
              </div>
            </>
          )}
        </section>
        <Pagination
          onPageChange={(page) => {
            const nextParams = new URLSearchParams(searchParams);
            if (page === 1) nextParams.delete("page");
            else nextParams.set("page", String(page));
            setSearchParams(nextParams, { replace: true });
          }}
          onPageSizeChange={(nextPageSize) => {
            setPageSize(nextPageSize);
            resetPage();
          }}
          page={currentPage}
          pageSize={pageSize}
          totalPages={Math.max(1, pageData?.totalPages ?? 1)}
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
  campaign?: Campaign;
  formId: string;
  mode: "create" | "edit";
  onSubmit: (
    body: CampaignSaveRequest,
    thumbnailFile: File | null,
    removeThumbnail: boolean,
  ) => void;
}

function selectedProductColumns(
  onRemove?: (productId: number) => void,
): DenseTableColumn<CampaignProduct>[] {
  const columns: DenseTableColumn<CampaignProduct>[] = [
    { key: "code", header: "상품코드", width: 118 },
    { id: "name", header: "상품명", render: (product) => <CampaignProductIdentity product={product} /> },
    {
      id: "saleStatus",
      header: "판매 상태",
      width: 88,
      align: "center",
      render: (product) => (
        <StatusPill tone={saleStatusTone(product.status)}>
          {productStatusLabel(product.status)}
        </StatusPill>
      ),
    },
  ];
  if (onRemove) columns.push({
      id: "delete",
      header: "관리",
      width: 70,
      align: "center",
      render: (product) => (
        <Button
          aria-label={`${product.productName || product.code || product.id} 삭제`}
          className="fuma-table-action"
          onClick={() => onRemove(product.id)}
          variant="danger"
        >
          제거
        </Button>
      ),
    });
  return columns;
}

function CampaignForm({ campaign, formId, mode, onSubmit }: CampaignFormProps) {
  const thumbnailInputId = useId();
  const thumbnailInputRef = useRef<HTMLInputElement | null>(null);
  const thumbnailObjectUrlRef = useRef<string | null>(null);
  const [isProductModalOpen, setProductModalOpen] = useState(false);
  const [products, setProducts] = useState<CampaignProduct[]>(
    campaign ? [...campaign.products] : [],
  );
  const [title, setTitle] = useState(campaign?.title ?? "");
  const [description, setDescription] = useState(campaign?.description ?? "");
  const [startDate, setStartDate] = useState(campaign?.startDate ?? "");
  const [endDate, setEndDate] = useState(campaign?.endDate ?? "");
  const [thumbnailFile, setThumbnailFile] = useState<File | null>(null);
  const [thumbnailPreviewUrl, setThumbnailPreviewUrl] = useState(campaign?.thumbnailUrl ?? "");
  const [removeThumbnail, setRemoveThumbnail] = useState(false);
  const [validationError, setValidationError] = useState("");

  useEffect(() => () => {
    if (thumbnailObjectUrlRef.current) URL.revokeObjectURL(thumbnailObjectUrlRef.current);
  }, []);

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const normalizedTitle = title.trim();
    const normalizedDescription = description.trim();
    if (!normalizedTitle || !normalizedDescription || !startDate || !endDate) {
      setValidationError("필수 항목을 모두 입력해주세요."); return;
    }
    if (startDate > endDate) { setValidationError("종료일은 시작일보다 빠를 수 없습니다."); return; }
    setValidationError("");
    onSubmit({
      title: normalizedTitle,
      description: normalizedDescription,
      startDate,
      endDate,
      thumbnailUrl: removeThumbnail ? null : campaign?.thumbnailUrl ?? null,
      productIds: products.map((product) => product.id),
    }, thumbnailFile, removeThumbnail);
  }

  return (
    <form className="fuma-campaign-editor" id={formId} onSubmit={handleSubmit}>
      <header className="fuma-campaign-editor__intro">
        <div>
          <strong>{mode === "create" ? "새 캠페인 정보" : campaign?.title}</strong>
          <span>캠페인명, 진행 기간, 썸네일과 해당 상품을 설정합니다.</span>
        </div>
        {campaign ? (
          <div className="fuma-campaign-editor__meta">
            <span>{campaign.id}</span>
            <StatusPill tone={statusTone(campaign.status)}>{campaignStatusLabel(campaign.status)}</StatusPill>
          </div>
        ) : null}
      </header>

      <div className="fuma-campaign-editor__layout">
        <section className="fuma-campaign-thumbnail-upload">
          <header>
            <h3>캠페인 썸네일</h3>
          </header>
          <div className="fuma-campaign-thumbnail-upload__body">
            <span className="fuma-campaign-thumbnail-upload__preview">
              {thumbnailPreviewUrl ? (
                <img alt="선택한 캠페인 썸네일 미리보기" onError={(event) => { event.currentTarget.onerror = null; event.currentTarget.src = assetUrl("/brand/thehyundai-hi.svg"); }} src={thumbnailPreviewUrl} />
              ) : (
                <span>
                  <strong>이미지 미선택</strong>
                  <small>1:1 비율 권장</small>
                </span>
              )}
            </span>
            <input
              accept="image/jpeg,image/png,image/webp"
              aria-label="캠페인 썸네일 파일"
              id={thumbnailInputId}
              onChange={(event) => {
                const file = event.target.files?.[0];
                if (!file) return;
                if (!CAMPAIGN_THUMBNAIL_TYPES.has(file.type)) {
                  setValidationError("썸네일은 JPG, PNG 또는 WEBP 파일만 선택할 수 있습니다.");
                  event.target.value = "";
                  return;
                }
                if (file.size > CAMPAIGN_THUMBNAIL_MAX_BYTES) {
                  setValidationError("썸네일 파일은 5MB 이하만 선택할 수 있습니다.");
                  event.target.value = "";
                  return;
                }
                if (thumbnailObjectUrlRef.current) URL.revokeObjectURL(thumbnailObjectUrlRef.current);
                const objectUrl = URL.createObjectURL(file);
                thumbnailObjectUrlRef.current = objectUrl;
                setThumbnailFile(file);
                setThumbnailPreviewUrl(objectUrl);
                setRemoveThumbnail(false);
                setValidationError("");
              }}
              ref={thumbnailInputRef}
              type="file"
            />
            <div className="fuma-campaign-thumbnail-upload__actions">
              <label
                className={buttonClassNames("secondary", "fuma-campaign-thumbnail-upload__action")}
                htmlFor={thumbnailInputId}
              >
                {thumbnailPreviewUrl ? "이미지 변경" : "이미지 선택"}
              </label>
              {thumbnailPreviewUrl ? (
                <Button
                  aria-label="캠페인 썸네일 삭제"
                  className="fuma-campaign-thumbnail-upload__action"
                  onClick={() => {
                    if (thumbnailObjectUrlRef.current) {
                      URL.revokeObjectURL(thumbnailObjectUrlRef.current);
                      thumbnailObjectUrlRef.current = null;
                    }
                    if (thumbnailInputRef.current) thumbnailInputRef.current.value = "";
                    setThumbnailFile(null);
                    setThumbnailPreviewUrl("");
                    setRemoveThumbnail(Boolean(campaign?.thumbnailUrl));
                    setValidationError("");
                  }}
                  variant="danger"
                >
                  이미지 삭제
                </Button>
              ) : null}
            </div>
            <small className="fuma-campaign-thumbnail-upload__help">
              {thumbnailFile ? thumbnailFile.name : "JPG, PNG, WEBP · 최대 5MB"}
            </small>
          </div>
        </section>

        <section className="fuma-campaign-form-section">
          <header>
            <h3>기본 정보</h3>
          </header>
          <div className="fuma-campaign-form">
            <FormRow label="캠페인명" required>
              <TextInput
                aria-label="캠페인명"
                className="fuma-campaign-name-input"
                maxLength={100}
                onChange={(event) => setTitle(event.target.value)}
                placeholder="캠페인명을 입력하세요"
                required value={title}
              />
            </FormRow>
            <FormRow label="설명" required>
              <textarea aria-label="설명" className="hsas-control hsas-text-input ui-input fuma-campaign-description-input" maxLength={2000} onChange={(event) => setDescription(event.target.value)} required rows={5} value={description} />
            </FormRow>
            <FormRow label="진행 기간" required>
              <div className="fuma-campaign-date-range">
                <TextInput
                  aria-label="시작일"
                  max={endDate || undefined}
                  onChange={(event) => setStartDate(event.target.value)}
                  required
                  type="date" value={startDate}
                />
                <span aria-hidden="true">~</span>
                <TextInput
                  aria-label="종료일"
                  min={startDate || undefined}
                  onChange={(event) => setEndDate(event.target.value)}
                  required
                  type="date" value={endDate}
                />
              </div>
            </FormRow>
          </div>
        </section>
      </div>

      {validationError ? <p role="alert">{validationError}</p> : null}

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
          currentProducts={products}
          onClose={() => setProductModalOpen(false)}
          onConfirm={(selectedProducts) => {
            setProducts(selectedProducts);
            setProductModalOpen(false);
          }}
        />
      ) : null}
    </form>
  );
}

interface CampaignEditorPanelProps {
  campaign?: Campaign;
  mode: "create" | "edit";
  onClose: () => void;
  onSaved?: () => void;
}

function CampaignEditorPanel({ campaign, mode, onClose, onSaved = onClose }: CampaignEditorPanelProps) {
  const formId = useId();
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");

  const save = async (
    body: CampaignSaveRequest,
    thumbnailFile: File | null,
    removeThumbnail: boolean,
  ) => {
    setPending(true); setError("");
    try {
      const thumbnailUrl = thumbnailFile
        ? (await uploadCampaignThumbnail(thumbnailFile)).url
        : body.thumbnailUrl;
      const saveBody = { ...body, thumbnailUrl };
      if (mode === "create") await createCampaign(saveBody);
      else {
        const updateBody: CampaignUpdateRequest = removeThumbnail
          ? { ...saveBody, removeThumbnail: true }
          : saveBody;
        await updateCampaign(campaign!.id, updateBody);
      }
      onSaved();
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "저장에 실패했습니다.");
    } finally { setPending(false); }
  };

  return (
    <SidePanel
      actions={
        <>
          <Button disabled={pending} onClick={onClose}>취소</Button>
          <Button disabled={pending} form={formId} type="submit" variant="primary">
            {pending ? "저장 중..." : mode === "create" ? "캠페인 생성" : "저장"}
          </Button>
        </>
      }
      animateOnOpen={mode === "create"}
      onClose={onClose}
      title={mode === "create" ? "새 캠페인 생성" : "캠페인 수정"}
    >
      <div className="fuma-detail-panel__content fuma-campaign-editor-panel">
        {error ? <p role="alert">{error}</p> : null}
        <CampaignForm
          campaign={campaign}
          formId={formId}
          key={campaign?.id ?? "new"}
          mode={mode}
          onSubmit={save}
        />
      </div>
    </SidePanel>
  );
}

interface CampaignPanelRouteProps {
  onSaved?: () => void;
}

export function CampaignCreatePage({ onSaved }: CampaignPanelRouteProps = {}) {
  const navigate = useNavigate();

  return <CampaignEditorPanel
    mode="create"
    onClose={() => navigate("/campaigns")}
    onSaved={() => { onSaved?.(); navigate("/campaigns"); }}
  />;
}

export function CampaignEditPage({ onSaved }: CampaignPanelRouteProps = {}) {
  const { campaignId } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const routeCampaign = (location.state as { campaign?: Campaign } | null)?.campaign;
  const [campaign, setCampaign] = useState<Campaign | null | undefined>(() =>
    routeCampaign?.id === Number(campaignId) ? routeCampaign : undefined);
  useEffect(() => {
    const controller = new AbortController();
    const id = Number(campaignId);
    getCampaign(id, controller.signal).then(setCampaign).catch(() => { if (!controller.signal.aborted) setCampaign(null); });
    return () => controller.abort();
  }, [campaignId]);

  return (
    campaign === undefined ? null : campaign ? (
        <CampaignEditorPanel
          campaign={campaign}
          mode="edit"
          onClose={() => navigate(`/campaigns?detail=${campaign.id}`)}
          onSaved={() => { onSaved?.(); navigate(`/campaigns?detail=${campaign.id}`); }}
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
      )
  );
}

export function CampaignWorkspacePage() {
  const { pathname } = useLocation();
  const [refreshRevision, setRefreshRevision] = useState(0);
  const editMatch = pathname.match(/^\/campaigns\/(\d+)\/edit$/);
  const detailMatch = pathname.match(/^\/campaigns\/(\d+)$/);
  const refreshCampaigns = () => setRefreshRevision((current) => current + 1);

  return (
    <>
      <CampaignListPage refreshRevision={refreshRevision} />
      {pathname === "/campaigns/new" ? <CampaignCreatePage onSaved={refreshCampaigns} /> : null}
      {editMatch ? <CampaignEditPage onSaved={refreshCampaigns} /> : null}
      {detailMatch ? <CampaignDetailPage campaignIdOverride={detailMatch[1]} embedded /> : null}
    </>
  );
}

const CAMPAIGN_DETAIL_PRODUCT_COLUMNS: DenseTableColumn<CampaignProduct>[] = [
  { key: "code", header: "상품코드", width: 118, align: "center" },
  { id: "name", header: "상품명", render: (product) => <CampaignProductIdentity product={product} /> },
  {
    id: "saleStatus",
    header: "판매 상태",
    width: 92,
    align: "center",
    render: (product) => (
      <StatusPill tone={saleStatusTone(product.status)}>
        {productStatusLabel(product.status)}
      </StatusPill>
    ),
  },
];

const CAMPAIGN_PARTICIPANT_COLUMNS: DenseTableColumn<CampaignParticipant>[] = [
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
    render: ({ nickname }) => nickname,
  },
  {
    id: "platform",
    header: "플랫폼",
    width: 140,
    align: "center",
    render: ({ platform }) => {
      const label = platform === "YOUTUBE" ? "YouTube" : platform === "INSTAGRAM" ? "Instagram" : null;
      return label ? <span className="fuma-platform-label"><PlatformIcon platform={label} /><span>{label}</span></span> : "-";
    },
  },
  {
    id: "account",
    header: "계정",
    align: "center",
    render: ({ accountId }) => accountId || "-",
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
  const { campaignId: routeCampaignId } = useParams();
  const navigate = useNavigate();
  const campaignId = Number(campaignIdOverride ?? routeCampaignId);
  const [campaign, setCampaign] = useState<Campaign | null>();
  const [participants, setParticipants] = useState<SpringPage<CampaignParticipant> | null>(null);
  const [participantsLoading, setParticipantsLoading] = useState(false);
  const [visibleProductCount, setVisibleProductCount] = useState(CAMPAIGN_DETAIL_PRODUCT_BATCH_SIZE);
  const [error, setError] = useState("");
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const closePanel = onClose ?? (() => navigate("/campaigns"));
  useEffect(() => {
    const controller = new AbortController();
    getCampaign(campaignId, controller.signal).then(setCampaign).catch((reason: unknown) => {
      if (!controller.signal.aborted) { setCampaign(null); setError(reason instanceof Error ? reason.message : "캠페인 상세 조회에 실패했습니다."); }
    });
    return () => controller.abort();
  }, [campaignId]);
  useEffect(() => {
    const controller = new AbortController();
    getCampaignParticipants(campaignId, 0, CAMPAIGN_PAGE_SIZE, controller.signal).then(setParticipants).catch((reason: unknown) => {
      if (!controller.signal.aborted) setError(reason instanceof Error ? reason.message : "참여 셀렉터스 조회에 실패했습니다.");
    });
    return () => controller.abort();
  }, [campaignId]);
  const loadMoreParticipants = async () => {
    if (!participants || participantsLoading || participants.number + 1 >= participants.totalPages) return;
    setParticipantsLoading(true); setError("");
    try {
      const nextPage = await getCampaignParticipants(
        campaignId,
        participants.number + 1,
        CAMPAIGN_PAGE_SIZE,
      );
      setParticipants((current) => current ? {
        ...nextPage,
        content: [...current.content, ...nextPage.content],
      } : nextPage);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "참여 셀렉터스 조회에 실패했습니다.");
    } finally {
      setParticipantsLoading(false);
    }
  };
  const removeCampaign = async () => {
    setDeleting(true); setError("");
    try { await deleteCampaign(campaignId); setDeleteOpen(false); closePanel(); }
    catch (reason) { setError(reason instanceof Error ? reason.message : "캠페인 삭제에 실패했습니다."); }
    finally { setDeleting(false); }
  };
  return (
    <>
      {embedded ? null : <CampaignListPage />}
      <SidePanel
        actions={campaign ? (<>
          <Link
            aria-label="캠페인 수정"
            className="hsas-button hsas-button--primary"
            state={{ campaign }}
            to={`/campaigns/${campaign.id}/edit`}
          >
            수정
          </Link>
          {campaign.status === "SCHEDULED" ? <Button onClick={() => setDeleteOpen(true)} variant="danger">삭제</Button> : null}
        </>) : null}
        onClose={closePanel}
        title="캠페인 상세"
      >
        <div className="fuma-detail-panel__content fuma-campaign-detail-panel">
        {error ? <p role="alert">{error}</p> : null}
        {campaign === undefined ? <p role="status">캠페인 정보를 불러오는 중입니다.</p> : campaign ? (
          <div className="fuma-campaign-detail fuma-campaign-detail--feed">
            <section aria-label="기본 정보" className="fuma-campaign-detail-overview">
              <figure className="fuma-campaign-detail-preview">
                <CampaignThumbnail campaign={campaign} />
              </figure>
              <div className="fuma-campaign-detail-overview__info">
                <header>
                  <div>
                    <h2>{campaign.title}</h2>
                  </div>
                </header>
                <p>{campaign.description}</p>
                <dl>
                  <div><dt>캠페인 ID</dt><dd>{campaign.id}</dd></div>
                  <div><dt>캠페인 진행 기간</dt><dd>{campaign.startDate} ~ {campaign.endDate}</dd></div>
                  <div>
                    <dt>진행 상태</dt>
                    <dd>
                      <StatusPill tone={statusTone(campaign.status)}>{campaignStatusLabel(campaign.status)}</StatusPill>
                    </dd>
                  </div>
                  <div><dt>포함 상품</dt><dd>{campaign.products.length}개</dd></div>
                </dl>
              </div>
            </section>

            <section aria-labelledby="campaign-products-title" className="fuma-campaign-detail-list-section">
              <div className="fuma-result-toolbar fuma-simple-result-toolbar fuma-campaign-detail-list-toolbar">
                <strong id="campaign-products-title">포함 상품</strong>
                <div className="fuma-settlement-result-meta">
                  <span>총 {campaign.products.length}건</span>
                </div>
              </div>
              <div
                className="fuma-wide-table fuma-settlement-table fuma-selector-list-table fuma-campaign-product-table"
                id="campaign-products"
              >
                <DenseTable
                  columns={CAMPAIGN_DETAIL_PRODUCT_COLUMNS}
                  emptyMessage="포함된 상품이 없습니다."
                  rowKey={(product) => product.id}
                  rows={campaign.products.slice(0, visibleProductCount)}
                />
              </div>
              {visibleProductCount < campaign.products.length ? (
                <div className="fuma-campaign-detail-load-more">
                  <Button onClick={() => setVisibleProductCount((current) => current + CAMPAIGN_DETAIL_PRODUCT_BATCH_SIZE)}>
                    포함 상품 더보기
                  </Button>
                </div>
              ) : null}
            </section>

            <section aria-labelledby="campaign-participants-title" className="fuma-campaign-detail-list-section">
              <div className="fuma-result-toolbar fuma-simple-result-toolbar fuma-campaign-detail-list-toolbar">
                <strong id="campaign-participants-title">참여 셀렉터스</strong>
                <div className="fuma-settlement-result-meta">
                  <span>총 {participants?.totalElements ?? 0}건</span>
                </div>
              </div>
              <div
                className="fuma-wide-table fuma-settlement-table fuma-selector-list-table fuma-campaign-participant-table"
                id="campaign-participants"
              >
                <DenseTable
                  columns={CAMPAIGN_PARTICIPANT_COLUMNS}
                  emptyMessage={participants ? "참여 셀렉터스가 없습니다." : "참여 셀렉터스를 불러오는 중입니다."}
                  rowKey={({ selectorId }) => selectorId}
                  rows={participants?.content ?? []}
                />
              </div>
              {participants && participants.content.length < participants.totalElements ? (
                <div className="fuma-campaign-detail-load-more">
                  <Button disabled={participantsLoading} onClick={loadMoreParticipants}>
                    {participantsLoading ? "불러오는 중..." : "참여 셀렉터스 더보기"}
                  </Button>
                </div>
              ) : null}
            </section>
          </div>
        ) : (
          <EmptyState
            description="요청한 캠페인 정보를 확인할 수 없습니다."
            title="대상을 찾을 수 없습니다"
          />
        )}
        </div>
      </SidePanel>
      {deleteOpen ? <Modal actions={<><Button disabled={deleting} onClick={() => setDeleteOpen(false)}>취소</Button><Button disabled={deleting} onClick={removeCampaign} variant="danger">{deleting ? "삭제 중..." : "삭제"}</Button></>} onClose={() => setDeleteOpen(false)} open role="alertdialog" title="캠페인 삭제"><p>시작 전 캠페인을 삭제할까요? 삭제 후 목록에서 보이지 않습니다.</p></Modal> : null}
    </>
  );
}

function ProductSearchModal({
  currentProducts,
  onClose,
  onConfirm,
}: {
  currentProducts: CampaignProduct[];
  onClose: () => void;
  onConfirm: (products: CampaignProduct[]) => void;
}) {
  const [query, setQuery] = useState("");
  const [appliedQuery, setAppliedQuery] = useState("");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(CAMPAIGN_PAGE_SIZE);
  const [pageData, setPageData] = useState<SpringPage<CampaignProduct> | null>(null);
  const [error, setError] = useState("");
  const [draftProducts, setDraftProducts] = useState(() => new Map(currentProducts.map((product) => [product.id, product])));
  useEffect(() => {
    const controller = new AbortController();
    getProducts({ keyword: appliedQuery || undefined, page: page - 1, size: pageSize }, controller.signal).then(setPageData).catch((reason: unknown) => {
      if (!controller.signal.aborted) setError(reason instanceof Error ? reason.message : "상품 조회에 실패했습니다.");
    });
    return () => controller.abort();
  }, [appliedQuery, page, pageSize]);
  const products = useMemo(() => pageData?.content ?? [], [pageData]);
  const columns: DenseTableColumn<CampaignProduct>[] = [
    {
      id: "selection",
      header: "선택",
      width: 52,
      align: "center",
      render: (product) => {
        const selected = draftProducts.has(product.id);
        const originallySelected = currentProducts.some((item) => item.id === product.id);
        return <Checkbox
          checked={selected}
          disabled={product.status !== "ON_SALE" && !selected && !originallySelected}
          label={<span className="hsas-visually-hidden">{product.productName || product.code || product.id} 선택</span>}
          onChange={() => {
            setDraftProducts((current) => {
              const next = new Map(current);
              if (next.has(product.id)) {
                next.delete(product.id);
              } else {
                next.set(product.id, product);
              }
              return next;
            });
          }}
        />;
      },
    },
    { key: "code", header: "상품코드", width: 118 },
    { id: "name", header: "상품명", render: (product) => <CampaignProductIdentity product={product} /> },
    {
      id: "saleStatus",
      header: "판매 상태",
      width: 90,
      align: "center",
      render: (product) => (
        <StatusPill tone={saleStatusTone(product.status)}>
          {productStatusLabel(product.status)}
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
              onConfirm([...draftProducts.values()]);
            }}
            variant="primary"
          >
            선택 완료 ({draftProducts.size})
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
              onKeyDown={(event) => { if (event.key === "Enter") { setAppliedQuery(query.trim()); setPage(1); } }}
              placeholder="상품명 또는 상품코드"
              value={query}
            />
          </FilterField>
          <Button onClick={() => { setAppliedQuery(query.trim()); setPage(1); }}>검색</Button>
          <span>총 {pageData?.totalElements ?? 0}개 상품</span>
        </div>
        {error ? <p role="alert">{error}</p> : null}
        <div
          aria-label="상품 목록"
          className="fuma-campaign-modal-table"
          role="region"
        >
          <DenseTable
            columns={columns}
            emptyMessage={pageData ? "상품이 없습니다." : "상품을 불러오는 중입니다."}
            rowKey={(row) => row.id}
            rows={products}
          />
        </div>
        <Pagination
          onPageChange={setPage}
          onPageSizeChange={(nextPageSize) => {
            setPageSize(nextPageSize);
            setPage(1);
          }}
          page={page}
          pageSize={pageSize}
          totalPages={Math.max(1, pageData?.totalPages ?? 1)}
        />
      </div>
    </Modal>
  );
}
