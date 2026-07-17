(function () {
  'use strict';

  var ACTIVE_KEY = 'kumano-main-live-trip-v1';
  var NAME_KEY = 'kumano-main-live-name-v1';
  var supabase = null;
  var state = {
    userId: '',
    trip: null,
    days: [],
    members: [],
    activity: [],
    role: 'viewer',
    selectedDayId: '',
    channel: null
  };

  var seedDays = [
    {
      tag: '中边路 · 启程',
      shortTitle: '泷尻 → 近露',
      route: '大阪 → 泷尻王子 → 近露王子',
      subtitle: '从大阪或关西机场进入纪伊半岛，踏上熊野古道的第一段山路。',
      metrics: { walk: '14–16 km', time: '6–7 小时', gain: '+1230 / −820 m' },
      note: '首日为全程爬升最高的一天；午餐为徒步途中补给的精品便当。',
      stops: [
        { type: 'transport', icon: '🚌', title: '大阪／关西机场附近酒店', detail: '专车接机，车程约 3 小时，直达徒步起点。' },
        { type: 'walk', icon: '⛩', title: '泷尻王子', detail: '徒步起点；沿古道前行约 4 km（约 1.5 小时）。' },
        { type: 'walk', icon: '🍱', title: '高原', detail: '午餐点，享用精品便当；随后继续徒步约 9 km（约 4 小时）。' },
        { type: 'walk', icon: '⛩', title: '近露王子', detail: '徒步终点；沿途可欣赏田园风光与传统日式村落。' },
        { type: 'hotel', icon: '♨', title: '海边酒店／指定民宿', detail: '入住并自行安排晚餐，完成第一天恢复。' }
      ]
    },
    {
      tag: '中边路 · 森林',
      shortTitle: '继樱 → 发心门',
      route: '酒店 → 继樱王子 → 发心门王子 → 酒店',
      subtitle: '穿行原始森林与古道分界地带，抵达通往本宫大社的关键入口。',
      metrics: { walk: '13 km', time: '6–7 小时', gain: '+780 / −980 m' },
      note: '当天终点为发心门王子；住宿安排为川汤温泉富士屋。',
      stops: [
        { type: 'transport', icon: '🚌', title: '酒店出发', detail: '早餐后乘车约 1.5 小时，抵达继樱王子。' },
        { type: 'walk', icon: '⛩', title: '继樱王子', detail: '徒步起点，开始 13 km 的森林古道。' },
        { type: 'walk', icon: '🌲', title: '山林古道', detail: '沉浸式徒步路段，适时补给精品便当。' },
        { type: 'walk', icon: '⛩', title: '发心门王子', detail: '徒步终点；通往熊野本宫大社的入口。' },
        { type: 'hotel', icon: '♨', title: '川汤温泉富士屋', detail: '返回酒店，温泉住宿。' }
      ]
    },
    {
      tag: '熊野三山 · 本宫',
      shortTitle: '发心门 → 本宫',
      route: '发心门王子 → 熊野本宫大社 → 温泉酒店',
      subtitle: '以舒缓里程抵达熊野本宫大社，并在汤之峰与川汤享受温泉体验。',
      metrics: { walk: '7 km', time: '3–4 小时', gain: '+190 / −460 m' },
      note: '当日步行距离较短，适合作为前两日长距离徒步后的恢复日。',
      stops: [
        { type: 'walk', icon: '⛩', title: '发心门王子', detail: '徒步起点；步行约 7 km（3–4 小时）。' },
        { type: 'walk', icon: '⛩', title: '熊野本宫大社', detail: '徒步终点，熊野三山之一。' },
        { type: 'walk', icon: '♨', title: '汤之峰温泉', detail: '可体验煮温泉蛋。' },
        { type: 'walk', icon: '♨', title: '川汤温泉', detail: '可在河边自行挖掘温泉池。' },
        { type: 'hotel', icon: '🍽', title: '海边温泉酒店', detail: '入住温泉酒店，享用会席料理。' }
      ]
    },
    {
      tag: '大边路 · 挑战',
      shortTitle: '小口 → 那智',
      route: '小口 → 青岸渡寺 → 那智瀑布 → 温泉酒店',
      subtitle: '全程最长、爬升最大的挑战日；从传统山村翻越山岭，走向那智瀑布。',
      metrics: { walk: '15.5 km', time: '7–8 小时', gain: '+1260 / −930 m' },
      note: '建议最早出发，并准备登山杖、雨具和充足的个人补给。',
      stops: [
        { type: 'transport', icon: '🚌', title: '酒店出发', detail: '乘车约 1–1.5 小时，前往小口。' },
        { type: 'walk', icon: '🏠', title: '小口', detail: '徒步起点，熊野古道中的传统山村。' },
        { type: 'walk', icon: '🥾', title: '越岭徒步', detail: '全程 15.5 km，预计 7–8 小时。' },
        { type: 'walk', icon: '🛕', title: '青岸渡寺', detail: '著名古寺，也是观赏那智瀑布的最佳地点之一。' },
        { type: 'walk', icon: '💧', title: '那智瀑布', detail: '感受熊野最具代表性的壮丽名景。' }
      ]
    },
    {
      tag: '熊野三山 · 收官',
      shortTitle: '三山巡礼',
      route: '那智 → 速玉大社 → 本宫 → 大阪',
      subtitle: '巡礼熊野三山的最后节点，领取完全踏破证明后返程。',
      metrics: { walk: '2.5 km', time: '0.5–1 小时', gain: '+200 m' },
      note: '胜浦鱼港参观与返程时间需按当天交通、鱼市与领队安排确认。',
      stops: [
        { type: 'walk', icon: '🐟', title: '胜浦鱼港', detail: '视鱼市与捕获量参观金枪鱼拍卖。' },
        { type: 'walk', icon: '⛩', title: '熊野那智大社 / 高野坂', detail: '参拜与沿海路段结合。' },
        { type: 'walk', icon: '⛩', title: '熊野速玉大社', detail: '熊野三山之一，位于新宫。' },
        { type: 'walk', icon: '⛩', title: '熊野本宫大社', detail: '领取完全踏破证明书。' },
        { type: 'transport', icon: '🚌', title: '返回大阪', detail: '专车送回关西机场或大阪市内酒店。' }
      ]
    }
  ].map(function (day, index) {
    day.dayNo = index + 1;
    return day;
  });

  function esc(value) {
    return String(value == null ? '' : value).replace(/[&<>'"]/g, function (char) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' }[char];
    });
  }

  function currentName() {
    return localStorage.getItem(NAME_KEY) || '';
  }

  function toast(message) {
    var target = document.getElementById('toast');
    if (!target) return;
    target.textContent = message;
    target.classList.add('show');
    clearTimeout(toast.timer);
    toast.timer = setTimeout(function () { target.classList.remove('show'); }, 3200);
  }

  function fmt(value) {
    if (!value) return '刚刚';
    var date = new Date(value);
    if (isNaN(date)) return '刚刚';
    return (date.getMonth() + 1) + '/' + date.getDate() + ' ' + String(date.getHours()).padStart(2, '0') + ':' + String(date.getMinutes()).padStart(2, '0');
  }

  function installStyle() {
    if (document.getElementById('kumano-live-style')) return;
    var style = document.createElement('style');
    style.id = 'kumano-live-style';
    style.textContent = [
      '.video-section{margin-top:78px}.video-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:15px}.video-card{position:relative;min-height:220px;padding:22px;overflow:hidden;border:1px solid rgba(84,105,87,.14);border-radius:21px;color:#fff;background:#1d3c2d;text-decoration:none;box-shadow:0 10px 30px rgba(40,56,44,.08)}.video-card:before{content:"";position:absolute;inset:0;background:linear-gradient(145deg,rgba(10,29,21,.86),rgba(18,52,37,.37)),url("https://commons.wikimedia.org/wiki/Special:FilePath/Kumano%20Kodo%20forest.jpg?width=1000") center/cover;transition:transform .4s}.video-card:nth-child(2):before,.video-card:nth-child(5):before{background-image:linear-gradient(145deg,rgba(10,29,21,.86),rgba(18,52,37,.37)),url("https://commons.wikimedia.org/wiki/Special:FilePath/Three-storied%20Pagoda%20of%20Seiganto-ji%20and%20Nachi%20Falls%20201911.jpg?width=1000")}.video-card:nth-child(3):before,.video-card:nth-child(6):before{background-image:linear-gradient(145deg,rgba(10,29,21,.86),rgba(18,52,37,.37)),url("https://commons.wikimedia.org/wiki/Special:FilePath/Kumano%20Kodo%20World%20heritage%20Yunomine%20Onsen%20Tsuboyu%20%E6%B9%AF%E3%81%AE%E5%B3%B0%E6%B8%A9%E6%B3%89%20%E3%81%A4%E3%81%BC%E6%B9%AF20.JPG?width=1000")}.video-card:hover:before{transform:scale(1.05)}.video-card>*{position:relative;z-index:1}.video-platform{display:inline-flex;padding:5px 8px;border:1px solid rgba(255,255,255,.25);border-radius:99px;color:#d8e7b6;font-size:.67rem;font-weight:800;letter-spacing:.08em}.video-card h3{margin:58px 0 7px;font-size:1.12rem;line-height:1.25}.video-card p{margin:0;color:rgba(255,255,255,.76);font-size:.78rem;line-height:1.56}.video-card .video-go{display:block;margin-top:15px;color:#f0d783;font-size:.74rem;font-weight:800}.story-link-card{display:flex;justify-content:space-between;align-items:center;gap:18px;margin-top:18px;padding:19px 21px;border-radius:17px;color:#edf4e4;background:linear-gradient(135deg,#193c33,#385f43);text-decoration:none}.story-link-card small{display:block;color:#cce0a8;font-size:.68rem;letter-spacing:.12em;font-weight:800}.story-link-card b{display:block;margin-top:5px;font-size:1rem}.story-link-card span{font-size:1.25rem}',
      '.live-collab-shell{padding:28px;border:1px solid rgba(84,105,87,.14);border-radius:23px;background:#fffdf8;box-shadow:0 10px 30px rgba(40,56,44,.055)}.live-collab-head{display:flex;justify-content:space-between;align-items:start;gap:18px;margin-bottom:19px}.live-collab-head h3{margin:0;color:#172a22;font:700 1.65rem/1.06 Georgia,"Songti SC",serif}.live-collab-head p{max-width:620px;margin:8px 0 0;color:#66736a;font-size:.85rem;line-height:1.65}.collab-live-status{display:inline-flex;align-items:center;gap:7px;padding:7px 10px;border-radius:99px;background:#edf3e5;color:#4b7046;font-size:.72rem;font-weight:800;white-space:nowrap}.collab-live-status:before{content:"";width:7px;height:7px;border-radius:50%;background:#6caf5d;box-shadow:0 0 0 3px rgba(108,175,93,.15)}.collab-live-status.wait{background:#fff0c9;color:#85611d}.collab-live-status.wait:before{background:#d0a541}.collab-live-status.error{background:#fbe8e2;color:#a45744}.collab-live-status.error:before{background:#d96a52}.collab-start{display:grid;grid-template-columns:1.02fr .98fr;gap:14px}.collab-panel{padding:22px;border:1px solid #e2decf;border-radius:17px;background:#fff}.collab-panel h4{margin:0;color:#20342a;font-size:1.03rem}.collab-panel p{margin:8px 0 16px;color:#718074;font-size:.82rem;line-height:1.62}.collab-field{margin-top:12px}.collab-field label{display:block;margin-bottom:6px;color:#435747;font-size:.74rem;font-weight:800}.collab-field input,.collab-field textarea,.collab-field select{width:100%;border:1px solid #ddd8ca;border-radius:10px;padding:10px 11px;color:#20342a;background:#fcfbf6;outline:none;font:inherit;font-size:.82rem}.collab-field textarea{min-height:74px;resize:vertical;line-height:1.55}.collab-field input:focus,.collab-field textarea:focus,.collab-field select:focus{border-color:#7b9f72;box-shadow:0 0 0 3px rgba(82,122,73,.12)}.live-btn{border:0;border-radius:10px;padding:11px 14px;color:#fff;background:#264a35;font-weight:800;font-size:.8rem;cursor:pointer}.live-btn:hover{background:#365f43}.live-btn.secondary{color:#365c3a;background:#e9f0dd}.live-btn:disabled{cursor:not-allowed;opacity:.55}.collab-action-row{display:flex;gap:9px;align-items:center;flex-wrap:wrap;margin-top:15px}.collab-note{padding:17px;border-radius:16px;color:#edf4e5;background:linear-gradient(145deg,#203e30,#355a3f)}.collab-note small{display:block;color:#cae2a5;font-size:.68rem;font-weight:800;letter-spacing:.12em}.collab-note b{display:block;margin-top:7px;font-size:1rem}.collab-note p{margin:8px 0 0;color:rgba(255,255,255,.72);font-size:.78rem;line-height:1.62}.collab-room{display:grid;grid-template-columns:.72fr 1.28fr;gap:16px}.collab-room-side{display:flex;flex-direction:column;gap:14px}.collab-stat{display:grid;grid-template-columns:repeat(2,1fr);gap:9px}.collab-stat div{padding:12px;border-radius:12px;background:#eef4e8}.collab-stat b{display:block;color:#234432;font-size:1.06rem}.collab-stat span{display:block;margin-top:3px;color:#63815d;font-size:.69rem}.collab-members{display:flex;flex-wrap:wrap;gap:8px;margin-top:13px}.live-avatar{display:inline-flex;align-items:center;gap:6px;padding:7px 9px;border:1px solid #e1ddcf;border-radius:99px;color:#476049;background:#fff;font-size:.72rem}.live-avatar i{display:grid;place-items:center;width:20px;height:20px;border-radius:50%;color:#365d3b;background:#dcebcf;font-style:normal;font-size:.66rem;font-weight:800}.member-role-list{display:grid;gap:8px;margin-top:14px}.member-role-row{display:flex;align-items:center;justify-content:space-between;gap:9px;padding-top:8px;border-top:1px solid #eee8dc;color:#526158;font-size:.75rem}.member-role-row select{max-width:115px;padding:7px 8px;font-size:.72rem}.activity-feed{margin:12px 0 0;padding:0;list-style:none}.activity-feed li{padding:9px 0;border-bottom:1px solid #ece7dc;color:#526158;font-size:.77rem;line-height:1.45}.activity-feed li:last-child{border:0}.activity-feed small{display:block;margin-top:3px;color:#8a968d;font-size:.67rem}.invite-result{margin-top:12px}.invite-result input{width:100%;border:1px solid #ddd8ca;border-radius:9px;padding:9px;background:#fcfbf6;color:#647169;font-size:.72rem}.collab-editor-head{display:flex;justify-content:space-between;gap:10px;align-items:end;margin-bottom:13px}.collab-editor-head h4{margin:0}.collab-editor-head p{margin:5px 0 0;color:#738078;font-size:.76rem;line-height:1.5}.collab-metrics{display:grid;grid-template-columns:repeat(3,1fr);gap:8px}.collab-help{display:block;margin-top:5px;color:#859189;font-size:.68rem;line-height:1.4}.live-empty{padding:21px;border:1px dashed #c9d6bf;border-radius:15px;color:#617164;background:#f7faf2;font-size:.82rem;line-height:1.6}.live-preflight{padding:17px;border:1px solid #ecd4cd;border-radius:15px;color:#775548;background:#fff4f0;font-size:.8rem;line-height:1.6}.live-preflight b{display:block;color:#9a5a47}.live-preflight code{display:inline-block;margin-top:6px;padding:3px 6px;border-radius:5px;background:#f0e3de;color:#7a564b;font-size:.72rem}',
      '@media(max-width:880px){.video-grid{grid-template-columns:1fr 1fr}.collab-start,.collab-room{grid-template-columns:1fr}.live-collab-head{flex-direction:column}.collab-live-status{white-space:normal}}@media(max-width:560px){.video-grid{grid-template-columns:1fr}.live-collab-shell{padding:20px}.collab-metrics{grid-template-columns:1fr}.story-link-card{align-items:flex-start}.story-link-card span{display:none}}'
    ].join('');
    document.head.appendChild(style);
  }

  function insertVideoSection() {
    if (document.getElementById('video')) return;
    var food = document.getElementById('food');
    if (!food || !food.parentNode) return;
    var section = document.createElement('section');
    section.id = 'video';
    section.className = 'section video-section';
    section.innerHTML = [
      '<div class="section-head"><div><div class="section-kicker">05 · WATCH BEFORE YOU WALK</div><h2>先看见这条路，<br>再走进这条路。</h2></div><p>将视频作为路况感知、节奏预演和情绪准备，而不是替代官方步道信息。小红书内容变化快，以下入口以“动态搜索”形式保留。</p></div>',
      '<div class="video-grid">',
      '<a class="video-card" href="https://www.bilibili.com/video/BV1UYujzTE2S/" target="_blank" rel="noopener"><span class="video-platform">BILIBILI · 全程攻略</span><h3>中边路全踏破</h3><p>适合先建立“路线、住宿、温泉、九十九王子”的整体概念。</p><span class="video-go">打开视频 ↗</span></a>',
      '<a class="video-card" href="https://www.bilibili.com/video/BV1VCa2zpEHF/" target="_blank" rel="noopener"><span class="video-platform">BILIBILI · DAY 1</span><h3>泷尻王子 → 近露</h3><p>首日爬升与石阶感受的直观参考，对应本行程体能核心日。</p><span class="video-go">打开视频 ↗</span></a>',
      '<a class="video-card" href="https://www.bilibili.com/video/BV1bZ421i74N/" target="_blank" rel="noopener"><span class="video-platform">BILIBILI · 装备</span><h3>五天四夜装备清单</h3><p>以他人实装作为参照；本网站装备清单仍以个人体能和季节为准。</p><span class="video-go">打开视频 ↗</span></a>',
      '<a class="video-card" href="https://www.youtube.com/results?search_query=Kumano+Kodo+Nakahechi+vlog" target="_blank" rel="noopener"><span class="video-platform">YOUTUBE · 英文 VLOG</span><h3>Nakahechi 深度记录</h3><p>用英文关键词聚合不同步速、季节与住宿条件的实拍内容。</p><span class="video-go">搜索 YouTube ↗</span></a>',
      '<a class="video-card" href="https://www.xiaohongshu.com/search_result?keyword=%E7%86%8A%E9%87%8E%E5%8F%A4%E9%81%93" target="_blank" rel="noopener"><span class="video-platform">XIAOHONGSHU · 动态笔记</span><h3>中文行前经验</h3><p>用于查看近期交通、行李、住宿和拍摄笔记；注意核对发布时间。</p><span class="video-go">搜索小红书 ↗</span></a>',
      '<a class="video-card" href="https://www.youtube.com/watch?v=q7WsvAqH4vw" target="_blank" rel="noopener"><span class="video-platform">UNESCO / NHK</span><h3>世界遗产的背景</h3><p>把熊野放回纪伊山地的信仰、山岳与海洋地理中理解。</p><span class="video-go">打开视频 ↗</span></a>',
      '</div>',
      '<a class="story-link-card" href="./stories.html"><div><small>KUMANO KODO STORY ATLAS</small><b>打开《熊野古道故事与景点》：从神话、巡礼到本次途经地</b></div><span>↗</span></a>'
    ].join('');
    food.parentNode.insertBefore(section, food);
  }

  function buildShell() {
    var section = document.getElementById('together');
    if (!section) return;
    section.innerHTML = [
      '<div class="section-head"><div><div class="section-kicker">09 · TRAVEL TOGETHER</div><h2>同一个计划，<br>同一份实时版本。</h2></div><p>这里不再是体验稿。组织者在本页创建旅程并生成邀请链接；朋友从同一链接加入后，拥有“可编辑”或“仅查看”权限，所有修改均经版本校验并留痕。</p></div>',
      '<div class="live-collab-shell">',
      '<div class="live-collab-head"><div><h3>同行协作空间</h3><p id="collab-status-copy">正在检查协作服务与当前旅程…</p></div><span id="collab-status" class="collab-live-status wait">连接中</span></div>',
      '<div id="collab-main"></div>',
      '</div>'
    ].join('');
  }

  function setStatus(text, copy, type) {
    var badge = document.getElementById('collab-status');
    var line = document.getElementById('collab-status-copy');
    if (badge) {
      badge.className = 'collab-live-status' + (type ? ' ' + type : '');
      badge.textContent = text;
    }
    if (line) line.textContent = copy;
  }

  function main() {
    return document.getElementById('collab-main');
  }

  function renderUnavailable(message) {
    setStatus('协作未连接', '主页面仍可浏览；实时邀请功能需要先完成连接。', 'error');
    if (!main()) return;
    main().innerHTML = [
      '<div class="live-preflight"><b>协作服务暂不可用</b>',
      '<span>' + esc(message || '请检查 Supabase 配置与网络后重试。') + '</span>',
      '<code>前置条件：Anonymous Users 已启用；supabase-schema.sql 已在目标项目执行；发布的 config.js 仅包含 Publishable Key。</code>',
      '</div>'
    ].join('');
  }

  function renderStart() {
    setStatus('协作已就绪', '先创建一个属于你的共享旅程，再把生成的链接发给朋友。', '');
    if (!main()) return;
    main().innerHTML = [
      '<div class="collab-start">',
      '<article class="collab-panel"><h4>创建同行空间</h4><p>创建后你将成为组织者。行程会保存在共享数据库中；此后的邀请、编辑和活动记录均由同一份数据驱动。</p>',
      '<div class="collab-field"><label for="collab-name">你的显示昵称</label><input id="collab-name" maxlength="30" value="' + esc(currentName()) + '" placeholder="例如：Tristan"></div>',
      '<div class="collab-action-row"><button id="collab-create" class="live-btn">创建共享旅程</button><span class="collab-help">首次创建只会生成这一份五日行程。</span></div>',
      '</article>',
      '<aside class="collab-note"><small>WHAT FRIENDS CAN DO</small><b>邀请不是共享浏览链接</b><p>朋友通过邀请码加入后，系统会记录成员身份、角色和操作；可编辑者能保存行程，查看者只能阅读，不会静默覆盖彼此修改。</p></aside>',
      '</div>'
    ].join('');
    var button = document.getElementById('collab-create');
    if (button) button.addEventListener('click', createTrip);
  }

  function renderJoin(params) {
    setStatus('收到邀请', '填写昵称并确认加入后，即可进入同一份实时行程。', 'wait');
    if (!main()) return;
    main().innerHTML = [
      '<div class="collab-start">',
      '<article class="collab-panel"><h4>加入同行者的共享旅程</h4><p>该邀请链接将把你加入当前旅程。加入后的权限由组织者在创建邀请时设定。</p>',
      '<div class="collab-field"><label for="collab-name">你的显示昵称</label><input id="collab-name" maxlength="30" value="' + esc(currentName()) + '" placeholder="例如：小林"></div>',
      '<div class="collab-action-row"><button id="collab-join" class="live-btn">加入共享旅程</button><button id="collab-cancel-join" class="live-btn secondary">暂不加入</button></div>',
      '</article>',
      '<aside class="collab-note"><small>INVITE SAFETY</small><b>角色和时间都可控</b><p>邀请默认有效期为 7 天。组织者可以生成“可编辑”或“仅查看”链接；未获邀请的人不会凭页面地址加入你的旅程。</p></aside>',
      '</div>'
    ].join('');
    var join = document.getElementById('collab-join');
    var cancel = document.getElementById('collab-cancel-join');
    if (join) join.addEventListener('click', function () { joinTrip(params); });
    if (cancel) cancel.addEventListener('click', function () {
      history.replaceState({}, '', location.pathname + location.hash);
      renderStart();
    });
  }

  function roleText(role) {
    return { owner: '组织者', editor: '可编辑', viewer: '仅查看' }[role] || '仅查看';
  }

  function avatar(name) {
    return (name || '同').slice(-1);
  }

  function formatStops(stops) {
    return (stops || []).map(function (stop) {
      return [stop.icon || '📍', stop.type || 'walk', stop.title || '', stop.detail || ''].join('|');
    }).join('\n');
  }

  function parseStops(text) {
    return String(text || '').split('\n').map(function (line) {
      var parts = line.trim().split('|').map(function (item) { return item.trim(); });
      if (!line.trim() || !parts[2]) return null;
      return {
        icon: parts[0] || '📍',
        type: ['walk', 'transport', 'hotel'].indexOf(parts[1]) >= 0 ? parts[1] : 'walk',
        title: parts[2],
        detail: parts.slice(3).join('|')
      };
    }).filter(Boolean);
  }

  function getSelected() {
    return state.days.find(function (day) { return day.id === state.selectedDayId; }) || state.days[0];
  }

  function renderRoom() {
    if (!state.trip || !main()) return;
    var canEdit = state.role === 'owner' || state.role === 'editor';
    var recent = state.activity.slice(0, 5);
    main().innerHTML = [
      '<div class="collab-room">',
      '<aside class="collab-room-side">',
      '<article class="collab-panel"><h4>' + esc(state.trip.name || '熊野古道全踏破') + '</h4><p>当前身份：<b>' + esc(roleText(state.role)) + '</b>。同一链接中的所有成员共享此版本。</p>',
      '<div class="collab-stat"><div><b>' + state.members.length + '</b><span>同行成员</span></div><div><b>' + state.days.length + '</b><span>协作行程日</span></div></div>',
      '<div class="collab-members">' + state.members.map(function (member) {
        return '<span class="live-avatar"><i>' + esc(avatar(member.display_name)) + '</i>' + esc(member.display_name || '同行者') + ' · ' + esc(roleText(member.role)) + '</span>';
      }).join('') + '</div>',
      (state.role === 'owner' && state.members.some(function (member) { return member.role !== 'owner'; }) ? '<div class="member-role-list"><span class="collab-help">组织者可调整已加入成员的权限：</span>' + state.members.filter(function (member) { return member.role !== 'owner'; }).map(function (member) {
        return '<label class="member-role-row"><span>' + esc(member.display_name || '同行者') + '</span><select data-member-role="' + esc(member.id) + '"><option value="editor"' + (member.role === 'editor' ? ' selected' : '') + '>可编辑</option><option value="viewer"' + (member.role === 'viewer' ? ' selected' : '') + '>仅查看</option></select></label>';
      }).join('') + '</div>' : ''),
      '</article>',
      '<article class="collab-panel"><h4>邀请朋友</h4><p>生成链接后可直接通过微信发送。链接含 7 天有效期；角色由你在生成时选择。</p>',
      '<div class="collab-field"><label for="collab-invite-role">朋友加入后的权限</label><select id="collab-invite-role" ' + (canEdit ? '' : 'disabled') + '><option value="editor">可编辑：可修改行程</option><option value="viewer">仅查看：可浏览全部内容</option></select></div>',
      '<div class="collab-action-row"><button id="collab-invite" class="live-btn" ' + (canEdit ? '' : 'disabled') + '>生成邀请链接</button></div><div id="collab-invite-result" class="invite-result"></div>',
      '</article>',
      '<article class="collab-panel"><h4>最近同步</h4><ul class="activity-feed">' + (recent.length ? recent.map(function (item) {
        return '<li>' + esc(item.text || '更新了行程') + '<small>' + esc(fmt(item.created_at)) + '</small></li>';
      }).join('') : '<li>尚无协作记录</li>') + '</ul></article>',
      '</aside>',
      '<article class="collab-panel"><div class="collab-editor-head"><div><h4>共同编辑行程</h4><p>保存时使用版本号校验；若他人已先保存，系统会拒绝覆盖并要求刷新。</p></div><span class="collab-live-status ' + (canEdit ? '' : 'wait') + '">' + (canEdit ? '可编辑' : '仅查看') + '</span></div>',
      '<div class="collab-field"><label for="collab-day-select">选择行程日</label><select id="collab-day-select">' + state.days.map(function (day) {
        var content = day.content || {};
        return '<option value="' + esc(day.id) + '"' + (day.id === state.selectedDayId ? ' selected' : '') + '>DAY ' + esc(day.day_no || content.dayNo || '') + ' · ' + esc(content.shortTitle || content.route || '行程日') + '</option>';
      }).join('') + '</select></div>',
      '<div id="collab-editor"></div>',
      '</article>',
      '</div>'
    ].join('');
    var invite = document.getElementById('collab-invite');
    var select = document.getElementById('collab-day-select');
    if (invite) invite.addEventListener('click', createInvite);
    if (select) select.addEventListener('change', function () {
      state.selectedDayId = select.value;
      renderEditor();
    });
    Array.prototype.forEach.call(document.querySelectorAll('[data-member-role]'), function (control) {
      control.addEventListener('change', function () { setMemberRole(control.getAttribute('data-member-role'), control.value, control); });
    });
    renderEditor();
  }

  function renderEditor() {
    var host = document.getElementById('collab-editor');
    var day = getSelected();
    if (!host || !day) return;
    var content = day.content || {};
    var metrics = content.metrics || {};
    var canEdit = state.role === 'owner' || state.role === 'editor';
    host.innerHTML = [
      '<form id="collab-edit-form">',
      '<div class="collab-field"><label for="edit-route">路线</label><textarea id="edit-route" ' + (canEdit ? '' : 'disabled') + '>' + esc(content.route) + '</textarea></div>',
      '<div class="collab-field"><label for="edit-subtitle">当日概览</label><textarea id="edit-subtitle" ' + (canEdit ? '' : 'disabled') + '>' + esc(content.subtitle) + '</textarea></div>',
      '<div class="collab-metrics"><div class="collab-field"><label for="edit-walk">徒步</label><input id="edit-walk" ' + (canEdit ? '' : 'disabled') + ' value="' + esc(metrics.walk) + '"></div><div class="collab-field"><label for="edit-time">预计时间</label><input id="edit-time" ' + (canEdit ? '' : 'disabled') + ' value="' + esc(metrics.time) + '"></div><div class="collab-field"><label for="edit-gain">累计升降</label><input id="edit-gain" ' + (canEdit ? '' : 'disabled') + ' value="' + esc(metrics.gain) + '"></div></div>',
      '<div class="collab-field"><label for="edit-stops">行程节点</label><textarea id="edit-stops" ' + (canEdit ? '' : 'disabled') + '>' + esc(formatStops(content.stops)) + '</textarea><span class="collab-help">每行格式：图标 | 类型（walk / transport / hotel）| 标题 | 说明</span></div>',
      '<div class="collab-field"><label for="edit-note">同行提醒</label><textarea id="edit-note" ' + (canEdit ? '' : 'disabled') + '>' + esc(content.note) + '</textarea></div>',
      '<div class="collab-action-row"><button class="live-btn" ' + (canEdit ? '' : 'disabled') + '>保存并同步</button><span class="collab-help">当前版本：' + esc(day.revision || 1) + '</span></div>',
      '</form>'
    ].join('');
    var form = document.getElementById('collab-edit-form');
    if (form && canEdit) form.addEventListener('submit', saveDay);
  }

  async function createTrip() {
    var input = document.getElementById('collab-name');
    var name = (input && input.value || '').trim() || '同行者';
    localStorage.setItem(NAME_KEY, name.slice(0, 30));
    var button = document.getElementById('collab-create');
    if (button) { button.disabled = true; button.textContent = '正在创建…'; }
    try {
      var result = await supabase.rpc('create_trip_with_days', {
        p_name: '熊野古道全踏破',
        p_summary: '五日中边路与大边路徒步计划；从泷尻王子出发，完成熊野三山巡礼。',
        p_days: seedDays,
        p_display_name: name.slice(0, 30)
      });
      if (result.error) throw result.error;
      localStorage.setItem(ACTIVE_KEY, result.data);
      await loadTrip(result.data);
      toast('共享旅程已创建，现在可以生成邀请链接。');
    } catch (error) {
      renderUnavailable(error.message || '创建共享旅程失败。');
    }
  }

  async function joinTrip(params) {
    var input = document.getElementById('collab-name');
    var name = (input && input.value || '').trim() || '同行者';
    localStorage.setItem(NAME_KEY, name.slice(0, 30));
    var button = document.getElementById('collab-join');
    if (button) { button.disabled = true; button.textContent = '正在加入…'; }
    try {
      var result = await supabase.rpc('join_trip_with_invite', {
        p_trip_id: params.trip,
        p_code: params.invite,
        p_display_name: name.slice(0, 30)
      });
      if (result.error) throw result.error;
      localStorage.setItem(ACTIVE_KEY, result.data);
      history.replaceState({}, '', location.pathname + '#together');
      await loadTrip(result.data);
      toast('已加入共享旅程。');
    } catch (error) {
      if (button) { button.disabled = false; button.textContent = '加入共享旅程'; }
      toast(error.message || '邀请无效、已过期或暂时无法加入。');
    }
  }

  async function createInvite() {
    var role = document.getElementById('collab-invite-role');
    var button = document.getElementById('collab-invite');
    if (!state.trip || !role) return;
    if (button) { button.disabled = true; button.textContent = '正在生成…'; }
    try {
      var result = await supabase.rpc('create_trip_invite', { p_trip_id: state.trip.id, p_role: role.value });
      if (result.error) throw result.error;
      var row = Array.isArray(result.data) ? result.data[0] : result.data;
      var link = location.origin + location.pathname + '?trip=' + encodeURIComponent(state.trip.id) + '&invite=' + encodeURIComponent(row.code) + '#together';
      var target = document.getElementById('collab-invite-result');
      if (target) {
        target.innerHTML = '<input id="collab-invite-link" readonly value="' + esc(link) + '"><div class="collab-action-row"><button id="collab-copy-invite" class="live-btn secondary">复制链接</button><span class="collab-help">有效至 ' + esc(fmt(row.expires_at)) + '</span></div>';
        var copy = document.getElementById('collab-copy-invite');
        if (copy) copy.addEventListener('click', function () {
          var field = document.getElementById('collab-invite-link');
          if (!field) return;
          if (navigator.clipboard && navigator.clipboard.writeText) {
            navigator.clipboard.writeText(field.value).then(function () { toast('邀请链接已复制，可直接发送给微信好友。'); }).catch(function () {
              field.select(); document.execCommand('copy'); toast('邀请链接已复制。');
            });
          } else {
            field.select(); document.execCommand('copy'); toast('邀请链接已复制。');
          }
        });
      }
      await loadTrip(state.trip.id);
    } catch (error) {
      toast(error.message || '生成邀请链接失败。');
      if (button) { button.disabled = false; button.textContent = '生成邀请链接'; }
    }
  }

  async function setMemberRole(memberId, role, control) {
    if (state.role !== 'owner') return;
    if (control) control.disabled = true;
    try {
      var result = await supabase.rpc('set_trip_member_role', {
        p_trip_id: state.trip.id,
        p_member_id: memberId,
        p_role: role
      });
      if (result.error) throw result.error;
      await loadTrip(state.trip.id);
      toast('成员权限已更新。');
    } catch (error) {
      if (control) control.disabled = false;
      toast(error.message || '更新成员权限失败。');
    }
  }

  async function saveDay(event) {
    event.preventDefault();
    var day = getSelected();
    if (!day) return;
    var stops = parseStops(document.getElementById('edit-stops').value);
    if (!stops.length) { toast('请至少保留一个行程节点。'); return; }
    var old = day.content || {};
    var next = Object.assign({}, old, {
      route: document.getElementById('edit-route').value.trim(),
      subtitle: document.getElementById('edit-subtitle').value.trim(),
      metrics: Object.assign({}, old.metrics || {}, {
        walk: document.getElementById('edit-walk').value.trim(),
        time: document.getElementById('edit-time').value.trim(),
        gain: document.getElementById('edit-gain').value.trim()
      }),
      stops: stops,
      note: document.getElementById('edit-note').value.trim()
    });
    var button = event.currentTarget.querySelector('button');
    if (button) { button.disabled = true; button.textContent = '正在同步…'; }
    try {
      var result = await supabase.rpc('update_trip_day', {
        p_trip_id: state.trip.id,
        p_day_id: day.id,
        p_content: next,
        p_expected_revision: day.revision
      });
      if (result.error) {
        if (String(result.error.message || '').indexOf('CONFLICT') >= 0) throw new Error('有同行者刚刚保存了新版本，请刷新后再编辑。');
        throw result.error;
      }
      await loadTrip(state.trip.id);
      toast('已同步给所有同行者。');
    } catch (error) {
      if (button) { button.disabled = false; button.textContent = '保存并同步'; }
      toast(error.message || '保存失败。');
    }
  }

  async function loadTrip(tripId) {
    var results = await Promise.all([
      supabase.from('trips').select('*').eq('id', tripId).single(),
      supabase.from('trip_days').select('*').eq('trip_id', tripId).order('day_no'),
      supabase.from('trip_members').select('*').eq('trip_id', tripId).order('joined_at'),
      supabase.from('trip_activity').select('*').eq('trip_id', tripId).order('created_at', { ascending: false }).limit(10)
    ]);
    var tripResult = results[0];
    var daysResult = results[1];
    var membersResult = results[2];
    var activityResult = results[3];
    if (tripResult.error || daysResult.error || membersResult.error || activityResult.error) {
      throw tripResult.error || daysResult.error || membersResult.error || activityResult.error;
    }
    state.trip = tripResult.data;
    state.days = daysResult.data || [];
    state.members = membersResult.data || [];
    state.activity = activityResult.data || [];
    var mine = state.members.find(function (member) { return member.user_id === state.userId; });
    state.role = mine ? mine.role : 'viewer';
    if (!state.selectedDayId || !state.days.some(function (day) { return day.id === state.selectedDayId; })) {
      state.selectedDayId = state.days[0] ? state.days[0].id : '';
    }
    setStatus('实时协作已连接', '正在使用共享数据库；成员、邀请和保存记录会同步到同一份旅程。', '');
    renderRoom();
    syncMainItinerary();
    subscribe();
  }

  function subscribe() {
    if (!supabase || !state.trip) return;
    if (state.channel) supabase.removeChannel(state.channel);
    var refreshTimer;
    var refresh = function () {
      clearTimeout(refreshTimer);
      refreshTimer = setTimeout(function () {
        loadTrip(state.trip.id).catch(function (error) { console.warn(error); });
      }, 350);
    };
    state.channel = supabase.channel('kumano-main-' + state.trip.id)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'trip_days', filter: 'trip_id=eq.' + state.trip.id }, refresh)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'trip_members', filter: 'trip_id=eq.' + state.trip.id }, refresh)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'trip_activity', filter: 'trip_id=eq.' + state.trip.id }, refresh)
      .subscribe();
  }

  function syncMainItinerary() {
    var rail = document.getElementById('day-rail');
    var detail = document.getElementById('day-detail');
    if (!rail || !detail || !state.days.length) return;
    var selected = 0;
    function draw(index) {
      selected = index;
      var row = state.days[index];
      var content = row.content || {};
      var metrics = content.metrics || {};
      rail.innerHTML = state.days.map(function (day, dayIndex) {
        var item = day.content || {};
        var itemMetrics = item.metrics || {};
        return '<button class="day-btn ' + (dayIndex === selected ? 'active' : '') + '" data-live-day="' + dayIndex + '"><small>DAY ' + esc(day.day_no || item.dayNo || dayIndex + 1) + '</small><b>' + esc(item.shortTitle || item.route || '行程日') + '</b><span>' + esc(itemMetrics.walk || '') + ' · ' + esc(itemMetrics.time || '') + '</span></button>';
      }).join('');
      detail.innerHTML = [
        '<div class="day-detail-top"><div><div class="meta">DAY ' + esc(row.day_no || content.dayNo || index + 1) + ' · ' + esc(content.tag || '共享行程') + '</div><h3>' + esc(content.route || '') + '</h3><p>' + esc(content.subtitle || '') + '</p></div><span class="pill live">实时版本</span></div>',
        '<div class="day-metrics"><div><small>徒步</small><b>' + esc(metrics.walk || '') + '</b></div><div><small>预计时间</small><b>' + esc(metrics.time || '') + '</b></div><div><small>累计升降</small><b>' + esc(metrics.gain || '') + '</b></div></div>',
        '<ul class="day-stops">' + (content.stops || []).map(function (stop) { return '<li><b>' + esc((stop.icon || '📍') + ' ' + (stop.title || '')) + '</b><span>' + esc(stop.detail || '') + '</span></li>'; }).join('') + '</ul>',
        '<p style="margin-top:18px;color:#a85744;font-weight:800;font-size:.8rem">◆ ' + esc(content.note || '') + '</p>'
      ].join('');
      Array.prototype.forEach.call(rail.querySelectorAll('[data-live-day]'), function (button) {
        button.addEventListener('click', function () { draw(Number(button.getAttribute('data-live-day'))); });
      });
    }
    draw(selected);
  }

  async function boot() {
    var config = window.KUMANO_CONFIG || {};
    var url = config.supabaseUrl;
    var key = config.supabasePublishableKey || config.supabaseAnonKey;
    if (!url || !key) {
      renderUnavailable('未找到有效的 Supabase URL 或 Publishable Key。');
      return;
    }
    try {
      setStatus('连接中', '正在使用匿名登录建立这位浏览者的协作身份…', 'wait');
      var module = await import('https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm');
      supabase = module.createClient(url, key);
      var sessionResult = await supabase.auth.getSession();
      if (sessionResult.error) throw sessionResult.error;
      var user = sessionResult.data && sessionResult.data.session && sessionResult.data.session.user;
      if (!user) {
        var signIn = await supabase.auth.signInAnonymously();
        if (signIn.error) throw signIn.error;
        user = signIn.data && signIn.data.user;
      }
      if (!user) throw new Error('无法建立协作身份。');
      state.userId = user.id;
      var params = new URLSearchParams(location.search);
      if (params.get('trip') && params.get('invite')) {
        renderJoin({ trip: params.get('trip'), invite: params.get('invite') });
        return;
      }
      var saved = localStorage.getItem(ACTIVE_KEY);
      if (saved) {
        try {
          await loadTrip(saved);
          return;
        } catch (error) {
          localStorage.removeItem(ACTIVE_KEY);
        }
      }
      renderStart();
    } catch (error) {
      renderUnavailable(error.message || '协作服务初始化失败。');
    }
  }

  function start() {
    installStyle();
    insertVideoSection();
    buildShell();
    boot();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', start);
  } else {
    start();
  }
}());
