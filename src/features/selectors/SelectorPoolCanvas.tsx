import { useEffect, useRef, useState } from "react";
import { PlatformIcon } from "../../components/social/PlatformIcon";
import { categoryLabel } from "../../entities/creator";
import type { SelectorSummary } from "../../entities/selectors";
import { assetUrl } from "../../lib/assetUrl";
import "../../styles/selector-pool.css";

const CATEGORY_RADIUS = 52;
const ORBIT_GAP = 26;
const DAMPING = 0.86;
const GOLDEN_ANGLE = 2.39996;

interface PoolNode {
  x: number;
  y: number;
  vx: number;
  vy: number;
  r: number;
  phase: number;
  orbit: number;
  categoryIndex: number;
  selector: SelectorSummary;
}

interface PoolCategory {
  label: string;
  x: number;
  y: number;
  count: number;
  /** 카테고리 색상. `rgb(r g b / a%)` 로 조합해 쓴다. */
  rgb: string;
}

const CATEGORY_COLORS = [
  "129 209 255", // 하늘
  "255 138 178", // 핑크
  "255 196 106", // 앰버
  "138 226 168", // 민트
  "192 160 255", // 라벤더
  "255 160 122", // 코럴
  "126 226 226", // 시안
  "222 214 130", // 라임
  "170 190 255", // 인디고
  "244 154 224", // 마젠타
];

// 백엔드 필드명이 확정 전이라 카테고리로 쓸 수 있는 키를 순서대로 훑는다.
const CATEGORY_KEYS = ["category", "categoryName", "categoryCode", "representativeCategory"];

function rawCategory(selector: SelectorSummary) {
  const record = selector as unknown as Record<string, unknown>;
  for (const key of CATEGORY_KEYS) {
    const value = record[key];
    if (typeof value === "string" && value.trim()) return value.trim();
  }
  return null;
}

function categoryOf(selector: SelectorSummary) {
  const raw = rawCategory(selector);
  return (raw ? categoryLabel(raw) : null) || "미분류";
}

/** 프로필 이미지가 없을 때 쓰는 계정 아이디 첫 글자. */
function initialOf(selector: SelectorSummary) {
  const source = selector.snsAccountId || selector.snsDisplayName || selector.nickname || "?";
  return source.slice(0, 1).toUpperCase();
}

function nodeRadius(followerCount: number | null) {
  return 17 + Math.min(15, Math.log10((followerCount ?? 0) + 1) * 3);
}

/** 카테고리 중심을 황금각 나선으로 흩뿌려 캔버스 곳곳에 배치한다. */
function layoutCategories(counts: Map<string, number>): PoolCategory[] {
  return [...counts.entries()].map(([label, count], index) => {
    const angle = index * GOLDEN_ANGLE;
    const distance = 300 * Math.sqrt(index);
    return {
      label,
      count,
      rgb: CATEGORY_COLORS[index % CATEGORY_COLORS.length],
      x: Math.cos(angle) * distance,
      y: Math.sin(angle) * distance,
    };
  });
}

function buildNodes(selectors: SelectorSummary[], categories: PoolCategory[]) {
  const indexByLabel = new Map(categories.map((category, index) => [category.label, index]));
  const seats = new Map<number, number>();

  return selectors.map((selector) => {
    const categoryIndex = indexByLabel.get(categoryOf(selector)) ?? 0;
    const seat = seats.get(categoryIndex) ?? 0;
    seats.set(categoryIndex, seat + 1);
    const category = categories[categoryIndex];
    const angle = seat * GOLDEN_ANGLE;
    const orbit = CATEGORY_RADIUS + ORBIT_GAP + Math.floor(seat / 10) * 66 + 30;
    return {
      x: category.x + Math.cos(angle) * orbit,
      y: category.y + Math.sin(angle) * orbit,
      vx: 0,
      vy: 0,
      r: nodeRadius(selector.followerCount),
      phase: ((selector.id % 100) / 100) * Math.PI * 2,
      orbit,
      categoryIndex,
      selector,
    } satisfies PoolNode;
  });
}

function loadImages(nodes: PoolNode[]) {
  const images = new Map<number, HTMLImageElement>();
  nodes.forEach((node) => {
    const source = assetUrl(node.selector.profileImageUrl ?? "");
    if (!source) return;
    const image = new Image();
    image.decoding = "async";
    image.onload = () => images.set(node.selector.id, image);
    image.src = source;
  });
  return images;
}

/** ponytail: O(n^2) 반발력. 노드가 수백 개를 넘어가면 공간 해싱으로 교체. */
function step(nodes: PoolNode[], categories: PoolCategory[]) {
  for (let index = 0; index < nodes.length; index += 1) {
    const node = nodes[index];
    const category = categories[node.categoryIndex];
    const dx = node.x - category.x;
    const dy = node.y - category.y;
    const distance = Math.hypot(dx, dy) || 0.001;
    const pull = (distance - node.orbit) * 0.004;
    node.vx -= (dx / distance) * pull;
    node.vy -= (dy / distance) * pull;

    for (let other = index + 1; other < nodes.length; other += 1) {
      const peer = nodes[other];
      const px = peer.x - node.x;
      const py = peer.y - node.y;
      const gap = Math.hypot(px, py) || 0.001;
      const minimum = node.r + peer.r + 12;
      if (gap >= minimum) continue;
      const push = ((minimum - gap) / minimum) * 0.9;
      node.vx -= (px / gap) * push;
      node.vy -= (py / gap) * push;
      peer.vx += (px / gap) * push;
      peer.vy += (py / gap) * push;
    }
  }

  nodes.forEach((node) => {
    node.vx *= DAMPING;
    node.vy *= DAMPING;
    node.x += node.vx;
    node.y += node.vy;
  });
}


function drawBubble(
  context: CanvasRenderingContext2D,
  node: PoolNode,
  x: number,
  y: number,
  radius: number,
  image: HTMLImageElement | undefined,
) {
  context.save();
  context.beginPath();
  context.arc(x, y, radius, 0, Math.PI * 2);
  context.clip();
  if (image) {
    context.drawImage(image, x - radius, y - radius, radius * 2, radius * 2);
  } else {
    context.fillStyle = "#243043";
    context.fillRect(x - radius, y - radius, radius * 2, radius * 2);
    context.fillStyle = "rgb(255 255 255 / 78%)";
    context.font = `600 ${Math.round(radius)}px Pretendard, sans-serif`;
    context.textAlign = "center";
    context.textBaseline = "middle";
    context.fillText(initialOf(node.selector), x, y);
  }
  context.restore();
}

/** 프로필 이미지가 없거나 깨지면 계정 아이디 첫 글자를 보여준다. */
function PoolAvatar({ selector }: { selector: SelectorSummary }) {
  const [failed, setFailed] = useState(false);
  const source = assetUrl(selector.profileImageUrl ?? "");

  return (
    <span className="hsas-selector-pool__dock-photo">
      {source && !failed ? (
        <img
          alt={`${selector.nickname} 프로필 이미지`}
          onError={() => setFailed(true)}
          src={source}
        />
      ) : (
        <span aria-hidden="true">{initialOf(selector)}</span>
      )}
    </span>
  );
}

export interface SelectorPoolCanvasProps {
  onSelect: (selector: SelectorSummary) => void;
  selectors: SelectorSummary[];
}

export function SelectorPoolCanvas({ onSelect, selectors }: SelectorPoolCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const selectRef = useRef(onSelect);
  const [visible, setVisible] = useState<SelectorSummary[]>([]);
  const [dockOpen, setDockOpen] = useState(true);

  useEffect(() => {
    selectRef.current = onSelect;
  }, [onSelect]);

  useEffect(() => {
    const canvas = canvasRef.current;
    const context = canvas?.getContext("2d");
    if (!canvas || !context) return;

    const counts = new Map<string, number>();
    selectors.forEach((selector) => {
      const label = categoryOf(selector);
      counts.set(label, (counts.get(label) ?? 0) + 1);
    });
    if (import.meta.env.DEV && selectors.length && !rawCategory(selectors[0])) {
      console.warn("[selector-pool] 목록 응답에 카테고리 필드가 없습니다. 응답 키:", Object.keys(selectors[0]));
    }
    const categories = layoutCategories(counts);
    if (!categories.length) return;
    const nodes = buildNodes(selectors, categories);
    const images = loadImages(nodes);
    const stars = Array.from({ length: 260 }, (_, index) => ({
      x: Math.sin(index * 12.9898) * 2600,
      y: Math.cos(index * 78.233) * 2600,
      r: (index % 3) * 0.4 + 0.4,
    }));

    const view = { x: 0, y: 0, scale: 0.8 };
    const pointer = { x: 0, y: 0 };
    let hovered: PoolNode | null = null;
    let dragging = false;
    let moved = 0;
    let frame = 0;

    const resize = () => {
      const ratio = window.devicePixelRatio || 1;
      const top = canvas.parentElement?.getBoundingClientRect().top ?? 0;
      canvas.parentElement?.style.setProperty("--hsas-pool-top", `${Math.round(top)}px`);
      const bounds = canvas.getBoundingClientRect();
      canvas.width = Math.max(1, Math.round(bounds.width * ratio));
      canvas.height = Math.max(1, Math.round(bounds.height * ratio));
    };
    resize();
    // 처음 열었을 때 전체 성단이 한눈에 들어오도록 맞춘다.
    const box = canvas.getBoundingClientRect();
    const reach = Math.max(
      ...nodes.map((node) => Math.hypot(node.x, node.y) + node.r),
      CATEGORY_RADIUS * 3,
    );
    view.scale = Math.min(1.1, Math.max(0.25, Math.min(box.width, box.height) / (reach * 2.2)));
    view.x = box.width / 2;
    view.y = box.height / 2;
    const observer = new ResizeObserver(resize);
    observer.observe(canvas);
    window.addEventListener("resize", resize);

    const toWorld = (clientX: number, clientY: number) => {
      const bounds = canvas.getBoundingClientRect();
      return {
        x: (clientX - bounds.left - view.x) / view.scale,
        y: (clientY - bounds.top - view.y) / view.scale,
      };
    };

    const hitTest = (worldX: number, worldY: number) => (
      nodes.find((node) => Math.hypot(node.x - worldX, node.y - worldY) <= node.r + 4) ?? null
    );

    const onPointerDown = (event: PointerEvent) => {
      dragging = true;
      moved = 0;
      pointer.x = event.clientX;
      pointer.y = event.clientY;
      canvas.setPointerCapture(event.pointerId);
    };
    const onPointerMove = (event: PointerEvent) => {
      if (dragging) {
        const dx = event.clientX - pointer.x;
        const dy = event.clientY - pointer.y;
        moved += Math.abs(dx) + Math.abs(dy);
        view.x += dx;
        view.y += dy;
      }
      pointer.x = event.clientX;
      pointer.y = event.clientY;
      const world = toWorld(event.clientX, event.clientY);
      hovered = dragging ? null : hitTest(world.x, world.y);
      canvas.style.cursor = dragging ? "grabbing" : hovered ? "pointer" : "grab";
    };
    const onPointerUp = (event: PointerEvent) => {
      if (dragging && moved < 5) {
        const world = toWorld(event.clientX, event.clientY);
        const target = hitTest(world.x, world.y);
        if (target) selectRef.current(target.selector);
      }
      dragging = false;
      canvas.releasePointerCapture(event.pointerId);
    };
    const onPointerLeave = () => {
      hovered = null;
    };
    const onWheel = (event: WheelEvent) => {
      event.preventDefault();
      const bounds = canvas.getBoundingClientRect();
      const cursorX = event.clientX - bounds.left;
      const cursorY = event.clientY - bounds.top;
      const next = Math.min(2.4, Math.max(0.2, view.scale * (event.deltaY < 0 ? 1.1 : 1 / 1.1)));
      view.x = cursorX - (cursorX - view.x) * (next / view.scale);
      view.y = cursorY - (cursorY - view.y) * (next / view.scale);
      view.scale = next;
    };

    canvas.addEventListener("pointerdown", onPointerDown);
    canvas.addEventListener("pointermove", onPointerMove);
    canvas.addEventListener("pointerup", onPointerUp);
    canvas.addEventListener("pointerleave", onPointerLeave);
    canvas.addEventListener("wheel", onWheel, { passive: false });

    const floatOf = (node: PoolNode, time: number) => ({
      x: node.x + Math.sin(time / 1400 + node.phase) * 5,
      y: node.y + Math.cos(time / 1700 + node.phase) * 5,
    });

    let visibleKey = "";
    let visibleCheckedAt = 0;
    /** 화면 안에 들어온 버블만 골라 왼쪽 목록에 넘긴다(초당 4회, 목록이 바뀔 때만 리렌더). */
    const syncVisible = (time: number, width: number, height: number) => {
      if (time - visibleCheckedAt < 250) return;
      visibleCheckedAt = time;
      const inView = nodes.filter((node) => {
        const screenX = node.x * view.scale + view.x;
        const screenY = node.y * view.scale + view.y;
        const radius = node.r * view.scale;
        return screenX + radius > 0 && screenX - radius < width
          && screenY + radius > 0 && screenY - radius < height;
      }).map((node) => node.selector);
      const key = inView.map((selector) => selector.id).join(",");
      if (key === visibleKey) return;
      visibleKey = key;
      setVisible(inView);
    };

    const render = (time: number) => {
      frame = requestAnimationFrame(render);
      step(nodes, categories);

      const ratio = window.devicePixelRatio || 1;
      const width = canvas.width / ratio;
      const height = canvas.height / ratio;
      context.setTransform(ratio, 0, 0, ratio, 0, 0);
      const backdrop = context.createLinearGradient(0, 0, 0, height);
      backdrop.addColorStop(0, "#fff");
      backdrop.addColorStop(1, "#f3f5f8");
      context.fillStyle = backdrop;
      context.fillRect(0, 0, width, height);
      syncVisible(time, width, height);
      context.translate(view.x, view.y);
      context.scale(view.scale, view.scale);

      context.fillStyle = "rgb(27 36 48 / 8%)";
      stars.forEach((star) => {
        context.beginPath();
        context.arc(star.x, star.y, star.r, 0, Math.PI * 2);
        context.fill();
      });

      context.lineWidth = 0.7;
      nodes.forEach((node, index) => {
        const category = categories[node.categoryIndex];
        const position = floatOf(node, time);
        context.strokeStyle = `rgb(${category.rgb} / ${hovered === node ? "75%" : "24%"})`;
        context.beginPath();
        context.moveTo(category.x, category.y);
        context.lineTo(position.x, position.y);
        context.stroke();

        const sibling = nodes[index + 1];
        if (sibling && sibling.categoryIndex === node.categoryIndex) {
          const siblingPosition = floatOf(sibling, time);
          context.strokeStyle = `rgb(${category.rgb} / 14%)`;
          context.beginPath();
          context.moveTo(position.x, position.y);
          context.lineTo(siblingPosition.x, siblingPosition.y);
          context.stroke();
        }
      });

      categories.forEach((category) => {
        const glow = context.createRadialGradient(
          category.x, category.y, CATEGORY_RADIUS * 0.2,
          category.x, category.y, CATEGORY_RADIUS * 2.4,
        );
        glow.addColorStop(0, `rgb(${category.rgb} / 40%)`);
        glow.addColorStop(1, `rgb(${category.rgb} / 0%)`);
        context.fillStyle = glow;
        context.beginPath();
        context.arc(category.x, category.y, CATEGORY_RADIUS * 2.4, 0, Math.PI * 2);
        context.fill();

        context.fillStyle = "rgb(19 32 56 / 92%)";
        context.strokeStyle = `rgb(${category.rgb} / 70%)`;
        context.lineWidth = 1.6;
        context.beginPath();
        context.arc(category.x, category.y, CATEGORY_RADIUS, 0, Math.PI * 2);
        context.fill();
        context.stroke();

        context.textAlign = "center";
        context.textBaseline = "middle";
        context.fillStyle = "#eaf2ff";
        context.font = "600 15px Pretendard, sans-serif";
        context.fillText(category.label, category.x, category.y - 6);
        context.fillStyle = "rgb(234 242 255 / 62%)";
        context.font = "500 11px Pretendard, sans-serif";
        context.fillText(`${category.count}명`, category.x, category.y + 13);
      });

      nodes.forEach((node) => {
        const position = floatOf(node, time);
        const active = hovered === node;
        const radius = node.r * (active ? 1.25 : 1);
        const tint = categories[node.categoryIndex].rgb;

        if (active) {
          context.strokeStyle = `rgb(${tint} / 55%)`;
          context.lineWidth = 2;
          context.beginPath();
          context.arc(position.x, position.y, radius + 6 + Math.sin(time / 220) * 3, 0, Math.PI * 2);
          context.stroke();
        }

        drawBubble(context, node, position.x, position.y, radius, images.get(node.selector.id));

        context.strokeStyle = active ? `rgb(${tint} / 95%)` : `rgb(${tint} / 55%)`;
        context.lineWidth = active ? 2.4 : 1.5;
        context.beginPath();
        context.arc(position.x, position.y, radius, 0, Math.PI * 2);
        context.stroke();

        if (active) {
          const label = node.selector.snsDisplayName
            || node.selector.snsAccountId
            || node.selector.nickname;
          context.font = "600 12px Pretendard, sans-serif";
          context.textAlign = "center";
          context.textBaseline = "middle";
          const labelWidth = context.measureText(label).width + 16;
          context.fillStyle = "rgb(24 32 46 / 92%)";
          context.beginPath();
          context.roundRect(position.x - labelWidth / 2, position.y + radius + 8, labelWidth, 22, 11);
          context.fill();
          context.fillStyle = "#eaf2ff";
          context.fillText(label, position.x, position.y + radius + 19);
        }
      });
    };
    frame = requestAnimationFrame(render);

    return () => {
      cancelAnimationFrame(frame);
      observer.disconnect();
      window.removeEventListener("resize", resize);
      canvas.removeEventListener("pointerdown", onPointerDown);
      canvas.removeEventListener("pointermove", onPointerMove);
      canvas.removeEventListener("pointerup", onPointerUp);
      canvas.removeEventListener("pointerleave", onPointerLeave);
      canvas.removeEventListener("wheel", onWheel);
    };
  }, [selectors]);

  return (
    <div className="hsas-selector-pool">
      <canvas
        aria-label="셀렉터스 발견 풀"
        className="hsas-selector-pool__canvas"
        ref={canvasRef}
        role="img"
      />
      <aside
        aria-label="현재 화면의 셀렉터스"
        className={`hsas-selector-pool__dock${dockOpen ? "" : " is-collapsed"}`}
      >
        <button
          aria-expanded={dockOpen}
          className="hsas-selector-pool__dock-toggle"
          onClick={() => setDockOpen((open) => !open)}
          type="button"
        >
          <span>{dockOpen ? `화면 속 셀렉터스 ${visible.length}` : "셀렉터스 목록 보기"}</span>
          <span aria-hidden="true">{dockOpen ? "˄" : "˅"}</span>
        </button>
        <div className="hsas-selector-pool__dock-viewport">
          <ul className="hsas-selector-pool__dock-list">
            {visible.map((selector) => (
              <li key={selector.id}>
                <button
                  className="hsas-selector-pool__dock-item"
                  onClick={() => onSelect(selector)}
                  type="button"
                >
                  <PoolAvatar selector={selector} />
                  <span className="hsas-selector-pool__dock-text">
                    <strong>{selector.nickname}</strong>
                    <span>
                      {selector.snsCode ? (
                        <PlatformIcon
                          decorative
                          platform={selector.snsCode === "YOUTUBE" ? "YouTube" : "Instagram"}
                        />
                      ) : null}
                      {selector.snsDisplayName || selector.snsAccountId || "-"}
                    </span>
                  </span>
                </button>
              </li>
            ))}
          </ul>
        </div>
      </aside>
    </div>
  );
}
