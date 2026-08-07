import { useState, type ReactNode } from "react";
import { Link, useNavigate, useParams, useSearchParams } from "react-router-dom";
import { PageHeader } from "../../components/shell/PageHeader";
import {
  Button,
  Checkbox,
  SegmentedControl,
  Select,
  TextInput,
} from "../../components/ui/Controls";
import { DenseTable, type DenseTableColumn } from "../../components/ui/DenseTable";
import { EmptyState } from "../../components/ui/EmptyState";
import { FormRow } from "../../components/ui/FormRow";
import { Modal } from "../../components/ui/Modal";
import { Pagination } from "../../components/ui/Pagination";
import { SearchPanel } from "../../components/ui/SearchPanel";
import { StatusPill, type StatusPillProps } from "../../components/ui/StatusPill";
import {
  CAMPAIGNS,
  CAMPAIGN_PRODUCTS,
  findCampaignFixture,
  type CampaignFixture,
  type CampaignProduct,
  type CampaignStatus,
} from "./fixtures";

const STATUS_OPTIONS = ["전체", "시작 전", "진행 중", "종료"].map((label) => ({
  label,
  value: label === "전체" ? "" : label,
}));
const ALL_OPTION = [{ label: "전체", value: "" }];

interface FilterFieldProps {
  children: ReactNode;
  htmlFor: string;
  label: string;
  className?: string;
}

function FilterField({ children, className, htmlFor, label }: FilterFieldProps) {
  return (
    <label
      className={["fuma-filter-field", className].filter(Boolean).join(" ")}
      htmlFor={htmlFor}
    >
      <span>{label}</span>
      {children}
    </label>
  );
}

function statusTone(status: CampaignStatus): NonNullable<StatusPillProps["tone"]> {
  if (status === "시작 전") {
    return "pending";
  }
  if (status === "진행 중") {
    return "approved";
  }
  return "neutral";
}

const CAMPAIGN_COLUMNS: DenseTableColumn<CampaignFixture>[] = [
  { key: "name", header: "캠페인명", width: 260 },
  { key: "startDate", header: "시작일", width: 112, align: "center" },
  { key: "endDate", header: "종료일", width: 112, align: "center" },
  {
    id: "productCount",
    header: "상품 수",
    width: 76,
    align: "right",
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
  {
    id: "management",
    header: "관리",
    width: 120,
    align: "center",
    render: (campaign) => (
      <div className="fuma-table-actions">
        <Link
          aria-label={`${campaign.name} 수정`}
          className="fuma-table-action fuma-table-link"
          to={`/campaigns/${campaign.id}/edit`}
        >
          수정
        </Link>
        <Button aria-label={`${campaign.name} 삭제`} className="fuma-table-action" variant="danger">
          삭제
        </Button>
      </div>
    ),
  },
];

export function CampaignListPage() {
  const navigate = useNavigate();

  return (
    <section className="fuma-page">
      <PageHeader screenCode="CP101" title="캠페인 관리" />
      <div className="fuma-page__body">
        <SearchPanel
          actions={
            <>
              <Button variant="primary">조회</Button>
              <Button>초기화</Button>
            </>
          }
        >
          <FilterField htmlFor="campaign-keyword" label="검색어">
            <TextInput
              aria-label="검색어"
              id="campaign-keyword"
              placeholder="캠페인명 검색"
            />
          </FilterField>
          <div className="fuma-campaign-period-filter">
            <FilterField htmlFor="campaign-start-date" label="시작일">
              <TextInput aria-label="시작일" id="campaign-start-date" type="date" />
            </FilterField>
            <FilterField htmlFor="campaign-end-date" label="종료일">
              <TextInput aria-label="종료일" id="campaign-end-date" type="date" />
            </FilterField>
          </div>
          <div className="fuma-campaign-status-filter">
            <span>상태</span>
            <SegmentedControl ariaLabel="상태" options={STATUS_OPTIONS} value="" />
          </div>
        </SearchPanel>
        <div className="fuma-result-toolbar fuma-campaign-result-toolbar">
          <strong>캠페인 목록</strong>
          <span>총 {CAMPAIGNS.length}건</span>
          <Link className="hsas-button hsas-button--primary fuma-result-toolbar__link" to="/campaigns/new">
            캠페인 생성
          </Link>
        </div>
        <div
          aria-label="캠페인 목록"
          className="fuma-wide-table fuma-campaign-list-table"
          role="region"
        >
          <DenseTable
            columns={CAMPAIGN_COLUMNS}
            onRowClick={(campaign) => navigate(`/campaigns/${campaign.id}`)}
            rowKey={(campaign) => campaign.id}
            rows={[...CAMPAIGNS]}
          />
        </div>
        <Pagination page={1} pageSize={20} totalPages={1} />
      </div>
    </section>
  );
}

const SELECTED_PRODUCT_COLUMNS: DenseTableColumn<CampaignProduct>[] = [
  { key: "id", header: "상품코드", width: 118 },
  { key: "name", header: "상품명" },
  {
    id: "delete",
    header: "삭제",
    width: 66,
    align: "center",
    render: (product) => (
      <Button aria-label={`${product.name} 삭제`} className="fuma-table-action" variant="danger">
        삭제
      </Button>
    ),
  },
];

interface CampaignFormProps {
  campaign?: CampaignFixture;
  mode: "create" | "edit";
}

function CampaignForm({ campaign, mode }: CampaignFormProps) {
  const [searchParams] = useSearchParams();
  const [isProductModalOpen, setProductModalOpen] = useState(
    mode === "create" && searchParams.get("fixture") === "product-modal",
  );
  const products = campaign?.products ?? [];

  return (
    <>
      <section className="fuma-content-section fuma-campaign-form-section">
        <header className="fuma-content-section__header">
          <h2>기본 정보</h2>
        </header>
        <div className="fuma-campaign-form">
          {campaign ? (
            <FormRow label="상태">
              <StatusPill tone={statusTone(campaign.status)}>{campaign.status}</StatusPill>
            </FormRow>
          ) : null}
          <FormRow label="캠페인명" required>
            <TextInput
              aria-label="캠페인명"
              className="fuma-campaign-name-input"
              defaultValue={campaign?.name ?? ""}
              placeholder="캠페인명을 입력하세요"
              required
            />
          </FormRow>
          <FormRow label="기간" required>
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
          <FormRow label="상품 선택" required>
            <div className="fuma-campaign-product-summary">
              <strong>선택된 상품 {products.length}개</strong>
              <span className="hsas-visually-hidden" id="campaign-product-required">
                필수 항목
              </span>
              <Button
                aria-describedby="campaign-product-required"
                onClick={() => setProductModalOpen(true)}
                variant="primary"
              >
                상품 선택
              </Button>
            </div>
          </FormRow>
        </div>
      </section>

      <section
        aria-labelledby="campaign-selected-products-title"
        className="fuma-content-section fuma-campaign-selected-products"
      >
        <header className="fuma-content-section__header">
          <h2 id="campaign-selected-products-title">선택 상품</h2>
          <span>총 {products.length}건</span>
        </header>
        <DenseTable
          columns={SELECTED_PRODUCT_COLUMNS}
          emptyMessage="선택된 상품이 없습니다."
          rowKey={(product) => product.id}
          rows={[...products]}
        />
      </section>

      <div className="fuma-campaign-form__actions">
        {mode === "edit" ? <Button variant="danger">삭제</Button> : null}
        <Button variant="primary">{mode === "create" ? "등록" : "저장"}</Button>
        <Button>취소</Button>
      </div>

      <ProductSearchModal open={isProductModalOpen} onClose={() => setProductModalOpen(false)} />
    </>
  );
}

export function CampaignCreatePage() {
  return (
    <section className="fuma-page">
      <PageHeader screenCode="CP102" title="캠페인 등록" />
      <div className="fuma-page__body">
        <CampaignForm mode="create" />
      </div>
    </section>
  );
}

export function CampaignEditPage() {
  const { campaignId } = useParams();
  const campaign = findCampaignFixture(campaignId);

  return (
    <section className="fuma-page">
      <PageHeader screenCode="CP103" title="캠페인 수정" />
      <div className="fuma-page__body">
        {campaign ? (
          <CampaignForm campaign={campaign} key={campaign.id} mode="edit" />
        ) : (
          <EmptyState
            description="요청한 캠페인 정보를 확인할 수 없습니다."
            title="대상을 찾을 수 없습니다"
          />
        )}
      </div>
    </section>
  );
}

export function CampaignDetailPage() {
  const { campaignId } = useParams();
  const campaign = findCampaignFixture(campaignId);

  return (
    <section className="fuma-page">
      <PageHeader screenCode="CP104" title="캠페인 상세" />
      <div className="fuma-page__body">
        {campaign ? (
          <>
            <div className="fuma-detail-toolbar">
              <Link className="hsas-button fuma-detail-toolbar__link" to="/campaigns">
                목록
              </Link>
            </div>
            <CampaignForm campaign={campaign} key={campaign.id} mode="edit" />
          </>
        ) : (
          <EmptyState
            description="요청한 캠페인 정보를 확인할 수 없습니다."
            title="대상을 찾을 수 없습니다"
          />
        )}
      </div>
    </section>
  );
}

const PRODUCT_SEARCH_COLUMNS: DenseTableColumn<CampaignProduct>[] = [
  {
    id: "selection",
    header: "선택",
    width: 46,
    align: "center",
    render: (product) => (
      <Checkbox
        label={<span className="hsas-visually-hidden">{product.name} 선택</span>}
      />
    ),
  },
  { key: "id", header: "판매상품코드", width: 96 },
  { key: "name", header: "판매상품명", width: 260 },
  { key: "saleStatus", header: "판매상태", width: 70, align: "center" },
  { key: "media", header: "상품매체", width: 72, align: "center" },
  { key: "vendor", header: "협력사", width: 122 },
  { key: "mdName", header: "MD명", width: 135 },
];

function ProductSearchModal({
  onClose,
  open,
}: {
  onClose: () => void;
  open: boolean;
}) {
  const product = CAMPAIGN_PRODUCTS[0];

  return (
    <Modal
      actions={
        <>
          <Button onClick={onClose} variant="primary">선택</Button>
          <Button onClick={onClose}>취소</Button>
        </>
      }
      open={open}
      title="상품 선택"
    >
      <div className="fuma-campaign-product-modal">
        <div className="fuma-campaign-modal-search">
          <SearchPanel actions={<Button className="fuma-campaign-modal__search-button">조회(F4)</Button>}>
            <FilterField htmlFor="product-vendor-code" label="협력사 코드">
              <TextInput
                aria-label="협력사 코드"
                defaultValue="004502"
                id="product-vendor-code"
              />
            </FilterField>
            <FilterField htmlFor="product-vendor-name" label="협력사명">
              <TextInput
                aria-label="협력사명"
                defaultValue="주식회사 현대백화점"
                id="product-vendor-name"
              />
            </FilterField>
            <FilterField htmlFor="product-secondary-vendor-code" label="2차 협력사 코드">
              <TextInput
                aria-label="2차 협력사 코드"
                defaultValue="761217"
                id="product-secondary-vendor-code"
              />
            </FilterField>
            <FilterField htmlFor="product-secondary-vendor-name" label="2차 협력사명">
              <TextInput
                aria-label="2차 협력사명"
                defaultValue="(2)골프인터내셔날"
                id="product-secondary-vendor-name"
              />
            </FilterField>
            <FilterField htmlFor="product-code" label="판매상품 코드">
              <TextInput
                aria-label="판매상품 코드"
                defaultValue={product.id}
                id="product-code"
              />
            </FilterField>
            <FilterField htmlFor="product-name" label="판매상품명">
              <TextInput
                aria-label="판매상품명"
                defaultValue={product.name}
                id="product-name"
              />
            </FilterField>
            <FilterField htmlFor="product-media" label="상품매체">
              <Select
                aria-label="상품매체"
                defaultValue=""
                id="product-media"
                options={ALL_OPTION}
              />
            </FilterField>
            <FilterField htmlFor="product-sale-status" label="판매상태">
              <Select
                aria-label="판매상태"
                defaultValue=""
                id="product-sale-status"
                options={ALL_OPTION}
              />
            </FilterField>
            <FilterField htmlFor="product-set-status" label="세트상품여부">
              <Select
                aria-label="세트상품여부"
                defaultValue=""
                id="product-set-status"
                options={ALL_OPTION}
              />
            </FilterField>
            <FilterField htmlFor="product-live-status" label="생방송상태여부">
              <Select
                aria-label="생방송상태여부"
                defaultValue=""
                id="product-live-status"
                options={ALL_OPTION}
              />
            </FilterField>
            <div className="fuma-campaign-modal-checks">
              <Checkbox label="기간(최근일주일)" />
              <Checkbox label="브랜드 검색" />
            </div>
          </SearchPanel>
        </div>
        <div className="fuma-result-toolbar">
          <strong>판매상품 목록</strong>
          <span>총 1건</span>
        </div>
        <div
          aria-label="판매상품 목록"
          className="fuma-campaign-modal-table"
          role="region"
        >
          <DenseTable
            columns={PRODUCT_SEARCH_COLUMNS}
            rowKey={(row) => row.id}
            rows={[product]}
          />
        </div>
        <Pagination page={1} pageSize={15} totalPages={1} />
      </div>
    </Modal>
  );
}
