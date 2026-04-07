# Rune DevTools

Rune 프레임워크용 브라우저 내 개발자 도구. 페이지 내장 오버레이 방식으로 컴포넌트 트리, 상태, 이벤트, 성능을 디버깅합니다.

## 특징

- **Component Tree** — View 계층 구조 시각화, 검색, 노드 선택 시 DOM 하이라이트
- **Data Inspector** — 선택된 View의 `data`, `_args`, 관계(parent/children), 메타 정보 표시. 인라인 편집 시 호스트 앱에 즉시 반영
- **Event Monitor** — `@on` 데코레이터 리스너 목록 + 실시간 `dispatchEvent` 로그
- **Redraw Tracker** — `redraw()` 호출 기록, 소요 시간 색상 코딩, attribute 변경 추적
- **ListView Monitor** — `set`, `append`, `remove`, `move`, `reset` 연산 로그 + diff 시각화
- **DOM Highlight** — 호스트 앱 위에서 마우스 hover로 View 경계 표시 + 클릭으로 선택. 다른 패널로 전환해도 모드 유지
- **Timeline** — 모든 이벤트 통합 시간축, 유형별 필터

## 설치

```bash
pnpm add -D rune-devtools rune-devtools-vite
```

## 사용법

### Vite Plugin (권장)

```typescript
// vite.config.ts
import { defineConfig } from 'vite';
import runeDevtools from 'rune-devtools-vite';

export default defineConfig({
  plugins: [runeDevtools()],
});
```

dev 서버 실행 시 자동으로 DevTools가 주입됩니다. 프로덕션 빌드에는 포함되지 않습니다.

### 수동 Import

```typescript
if (import.meta.env.DEV) {
  const { initDevtools } = await import('rune-devtools');
  initDevtools({
    position: 'bottom',
    shortcut: 'ctrl+shift+d',
  });
}
```

## 옵션

```typescript
runeDevtools({
  position: 'bottom',       // 'bottom' | 'top' (기본: 'bottom')
  shortcut: 'ctrl+shift+d', // 토글 단축키 (기본: 'ctrl+shift+d')
  maxEvents: 1000,           // 타임라인 최대 기록 (기본: 1000)
  defaultPanel: 'tree',      // 기본 패널 (기본: 'tree')
})
```

## 단축키

| 단축키 | 동작 |
|--------|------|
| `Ctrl+Shift+D` | DevTools 툴바 토글 |
| `Escape` | DOM Highlight 모드 해제 |

## 플러그인 API

```typescript
import { initDevtools } from 'rune-devtools';
import type { DevtoolsPlugin } from 'rune-devtools';

const myPlugin: DevtoolsPlugin = {
  name: 'my-plugin',
  setup(api) {
    // 커스텀 패널 추가
    api.addPanel({ id: 'my-panel', label: 'My Panel', icon: '...', createView: () => el });

    // 이벤트 구독
    api.onViewRender((snapshot) => { /* View 렌더 시 */ });
    api.onViewUnmount((viewId) => { /* View 언마운트 시 */ });
    api.onRedraw((record) => { /* redraw 시 */ });
    api.onListViewMutation((record) => { /* ListView 변경 시 */ });

    // 타임라인에 커스텀 이벤트 추가
    api.addTimelineEvent({ type: 'render', viewId: 'v1', constructorName: 'MyView', summary: '...', detail: null, timestamp: performance.now() });
  },
};

initDevtools({ plugins: [myPlugin] });
```

## 아키텍처

```
Host App (Rune)
├── View.prototype.*  ──> Interceptor Layer (monkey patch)
├── ListView.prototype.*      ↓
│                         State Store (serialized snapshots, ring buffers)
│                              ↓
├── Shadow DOM ─────── Overlay UI (Rune 기반, DEVTOOLS_MARKER로 자체 격리)
│   └── Toolbar + 7 Panels
│
└── Highlight Overlay (Shadow DOM 밖, document.body 위 absolute positioned)
```

- **Interceptor Layer** — `_onRender`, `_onMount`, `redraw`, `dispatchEvent`, ListView 메서드 등을 패치하여 데이터 수집
- **State Store** — 직렬화된 스냅샷으로 보관, Ring Buffer로 메모리 관리, unmounted View 30초 후 자동 정리
- **Overlay UI** — Shadow DOM 내에서 렌더링하여 호스트 앱 스타일과 완전 격리

## 개발

```bash
# 의존성 설치
pnpm install

# 테스트
pnpm test

# 전체 빌드
pnpm -r run build

# 플레이그라운드 실행
pnpm --filter rune-devtools-playground dev
```

## 패키지 구조

| 패키지 | 설명 |
|--------|------|
| `rune-devtools` | 코어 — 인터셉터, 스토어, UI |
| `rune-devtools-vite` | Vite 플러그인 — dev 모드에서 자동 주입 |

## 요구사항

- `rune-ts` >= 0.9.8 (peer dependency)
- `vite` >= 5.0.0 (Vite 플러그인용)

## 라이선스

MIT
