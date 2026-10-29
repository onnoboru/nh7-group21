# Implementation contract

## idea_like: ローカル施策の実装状況

`ideas/idea_like.md` と `ideas/image.png` にある「ペットと遊ぶ → 祖父母へ質問を届ける → 家族の返事 → ペットの成長と小さな報酬 → 月末の冊子」を、共有端末で試せるローカル体験として実装済み。Charlie は仮の名前。実装項目と残作業は [`TODO.md`](TODO.md) に記録する。

### 目指す体験

子どもが週の中でペットの Charlie（仮称）に餌をあげたり、一緒に遊んだりする。ペットが祖父母への質問を届け、祖父母は短い物語または音声で返す。返答を受け取るとペットが成長し、部屋の飾りやストーリーブックに家族の記録が増える。毎日の連続達成を強いる仕組みや、失敗でペットが弱る仕組みは設けない。

### Phase 1: 共有端末で遊べるローカル試作 — 完了

- ホームをCharlieの成長表示を中心に再構成し、餌やり、ゲーム、今週の質問、ストーリーブックを利用できる。
- クイズ、Guided Talk、Random Talk、Would You Rather、Story Game、Then & Now、Walk with Charlie の7形式を選び、未プレイのお題からランダムに始められる。対面活動を完了するとCharlieにも経験値が貯まり、レベル・部屋飾りが更新される。
- 週替わり質問に同じ端末から文章または利用者が明示的に録音した音声で返事できる。音声はブラウザーのIndexedDB内に保存し、文章だけでも完了できる。
- CharactersタブでCharlieのプロフィールと架空のデモキャラクターを見られる。月内の活動と家族の返事をまとめた冊子を表示・印刷できる。
- ゲーム完了時・家族の返事時に成長を祝う。餌は1日1回で、世話をしない日があっても成長を失わない。
- GPSや正確な位置情報は使わない。Walk with Charlie は安全な散歩中または想像上で行う会話ゲームである。
- `kindred.v1` の既存データを保持してバージョン2に移行する。設定からゲームデータとローカル音声を削除できる。

**確認:** 純粋ロジック、保存形式の移行、画面操作、音声ストレージを自動テストする。実機マイクの許可や、家族による使いやすさはブラウザー・利用者での試用が必要。

### Phase 2: 家族間で端末をまたいで使う

ローカル試作で体験を確認してから、招待コードで承認済みの家族だけを結ぶ。保護者が子どものプロフィールと招待を管理し、質問と返答に限ったやり取りから始める。自由なチャット、公開プロフィール、見知らぬ人とのマッチングは初期範囲に含めない。

複数端末で進捗と音声を共有するには GitHub Pages の静的サイトだけでは足りない。CPU サーバーに API、データベース、認証、音声ファイルの非公開保存を追加する。音声・画像には明示的な送信操作、保護者向け削除、保存期間の設定、アクセス制御を用意してから限定家族テストへ進む。サーバーが未準備の間は、共有端末上のローカル試作を提供する。

### Phase 3: 家族・地域で検証して拡張

シンガポールの家族ペアで、質問が会話を生むか、祖父母が音声を無理なく返せるか、週次の頻度が負担にならないかを確認する。結果に基づいてテーマ集、ペットの成長表現、印刷冊子を増やす。地域団体向け機能や遠隔の新しい相手との交流は、家族向け体験と安全運用を確認した後に別途設計する。

### 今後の段階に残すもの

- 端末間の同期、認証、招待、非公開サーバー保存、公開。
- 子ども向け広告、位置追跡、公開ランキング、ペットを衰弱させる連続ログイン要件。
- 保護者の承認・通報・ブロック・データ管理が整う前の、見知らぬ利用者との交流。
- 録音内容を使った AI 分析や自動要約。初期のストーリーブックは入力済みの文章と定型レイアウトから作る。

Build **GrandPals**, an English-language, responsive, local-first intergenerational community prototype based on idea_a.md. No runtime dependencies, external assets, trackers, or build step. Static deployable `dist/` with relative URLs. Japanese README only; all product text English.

## Face-to-face use
Support two real people on one shared device without a profile. Enter two distinct nicknames and choose one of seven activity styles. Both people answer each quiz question before revealing the answer; both take a turn on every conversation prompt. Completed sessions save their names and quiz scores in My circle without a review form, award 30 shared points, and add 10 Charlie growth points. Preserve existing v1 saved data, community demo, solo activities, and hosting portability. In-progress activities are not persisted.

## Ownership
- Core agent: `dist/core.js`, `tests/core.test.mjs`.
- UI agent: `dist/app.js`, `dist/index.html`.
- Design agent: `dist/styles.css`, optional original SVG assets in `dist/assets/`.
- Parent: package scripts, local server, Japanese docs, deployment workflow, integration and validation.

## Shared UI structure
Use `body`, `.app-shell`, `.sidebar`, `.brand`, `.brand-mark`, `.nav`, `.nav-item` (`.active`), `.sidebar-footer`, `.main`, `.topbar`, `.page-heading`, `.eyebrow`, `.page-title`, `.muted`, `.header-actions`, `.avatar`, `.points-pill`, `.button` (`.primary`, `.secondary`, `.ghost`, `.small`), `.hero`, `.hero-copy`, `.hero-art`, `.hero-tag`, `.hero-stats`, `.section-heading`, `.card`, `.grid`, `.match-grid`, `.match-card`, `.person-avatar`, `.interest-tag`, `.tags`, `.match-reason`, `.section-grid`, `.activity-card`, `.group-card`, `.reward-card`, `.empty-state`, `.modal-backdrop`, `.modal`, `.form-field`, `.choice-grid`, `.choice`, `.selected`, `.toast`, `.session-layout`, `.call-stage`, `.session-controls`, `.quiz-option`, `.review-stars`, `.notice`, `.progress-track`, `.progress-fill`.
UI agent can add classes and coordinate with design agent. Use emoji/icon-like inline SVG sparingly; create warm sophisticated illustrated hero with SVG/CSS, cream background, forest green primary, apricot accents, rounded cards, bold readable system typography. Desktop sidebar, mobile responsive bottom navigation. Product should look finished, not a generic landing page.

## Core exports (all pure unless explicitly persistence)
`INTERESTS`: array `{id, label, icon}`; interests ids `gardening`, `cooking`, `music`, `stories`, `art`, `games`.
`PEOPLE`: array `{id, name, age, generation: 'young'|'senior', interests: string[], bio, availability, color, initials}` (fictional profiles).
`GROUPS`: array `{id, name, interest, members, description, icon, color}`.
`REWARDS`: array `{id, name, description, cost, icon}` (clearly sample vouchers).
`ACTIVITIES`: array `{id, title, interest, kind: 'quiz'|'conversation'|'random'|'choice'|'collaborative'|'reflection'|'walk', description, duration, icon, prompts: string[], questions?: [{question, answers: string[], correct: number, explanation}]}`.
`createState()`: version 2 state with the existing profile, points, reviews and community-demo history plus `petJourney: {fedDates: [], weeks: []}`. Version 1 data migrates without discarding existing records.
`saveState(state, storage=globalThis.localStorage)`, `loadState(storage=globalThis.localStorage)` graceful on invalid storage/data. `saveState` returns boolean.
`setProfile(state, {name, age, interests, guardianConsent})`: returns new state or throws English Error; ages 6..110, name 1..40, >=1 interest. `age<12` always family mode, `age<18` needs guardianConsent for online-demo mode.
`getMode(profile)`: `'family'|'community'` (under 12, and under 18 without consent => family).
`getMatches(state)`: array of PEOPLE with `sharedInterests`, `score`, `reason`. opposite generation only, shared interest required, family mode returns []. Young profile age<60 matches senior; senior matches young. No matching real users.
`getRecommendedGroups(state)`: GROUPS with `reason`, based on interests and positively reviewed activity interests.
`getSuggestedActivity(state, personId?)`: ACTIVITY.
`completeSession(state, {id, personId:null|string, activityId, rating:1..5, note, addFriend:boolean})`: new state; +30 points once per unique session id; only valid PEOPLE, ACTIVITIES; family mode cannot add external friends. idempotent duplicate ids. Stores review including activity interest, rating and note. Completed activity required by UI before opening review.
`joinGroup(state, groupId)`: new state, idempotent; `redeemReward(state,rewardId)`: new state or error for insufficient points; creates local demo voucher `{id,rewardId,code,cost}` and deducts points.

## UX requirements
Navigation: Discover, Activities, Characters, My circle, Rewards. Discover opens on Charlie’s local journey; face-to-face activities work without profile setup. The optional profile flow collects nickname, age, interests and guardian involvement. Settings provide text-size, read-aloud, saved-pair, and reset controls. No fabricated statistics claim real users; community previews are labeled as samples.
Discover: Charlie’s growth, daily theme, weekly family question, and storybook. The Characters tab explains Charlie’s role and growth, and shows clearly labelled fictional activity-preview characters. Charlie also appears during game selection, instructions, and celebrations. Activities: seven playable styles with illustrations and randomly selected unplayed content. Face-to-face sessions keep the first player’s quiz choice hidden until the second answers and save completed sessions without requiring ratings. Community demo sessions remain simulated and use the optional review flow. Shared points, Charlie growth, history, groups, and sample rewards are local. Family mode offers activities together and prevents community session launch.
No real AI API: recommendation reasons are based on interests and ratings; label them "Smart picks" / "Based on your interests", not falsely AI-generated. README explains AI and real calls are future server integrations. No copyrighted clips; use built-in prompts/quizzes.

Accessibility: native buttons, labeled forms, dialog focus trapping/escape/return focus, status live region, visible keyboard focus, reduced motion, >=44px touch targets, mobile fit.
