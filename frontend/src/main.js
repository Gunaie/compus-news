import { createApp as createVueApp, createSSRApp } from 'vue'
import App from './App.vue'
import { createAppRouter } from './router'
import { createAppStore } from './store'

import { 
  Button, 
  NavBar, 
  Tabbar, 
  TabbarItem, 
  Tab, 
  Tabs, 
  List, 
  PullRefresh, 
  Cell, 
  CellGroup,
  Grid,
  GridItem,
  Empty,
  Form,
  Field,
  Image as VanImage,
  Toast,
  Icon,
  Popup,
  Loading
} from 'vant'

// 仅加载已注册组件及其依赖的 Vant 样式（直接导入 CSS，兼容 Node SSR）
import 'vant/lib/style/base.css'
import 'vant/lib/badge/index.css'
import 'vant/lib/button/index.css'
import 'vant/lib/nav-bar/index.css'
import 'vant/lib/tabbar/index.css'
import 'vant/lib/tabbar-item/index.css'
import 'vant/lib/sticky/index.css'
import 'vant/lib/swipe/index.css'
import 'vant/lib/swipe-item/index.css'
import 'vant/lib/tabs/index.css'
import 'vant/lib/tab/index.css'
import 'vant/lib/list/index.css'
import 'vant/lib/pull-refresh/index.css'
import 'vant/lib/cell/index.css'
import 'vant/lib/cell-group/index.css'
import 'vant/lib/grid/index.css'
import 'vant/lib/grid-item/index.css'
import 'vant/lib/empty/index.css'
import 'vant/lib/field/index.css'
import 'vant/lib/image/index.css'
import 'vant/lib/overlay/index.css'
import 'vant/lib/popup/index.css'
import 'vant/lib/toast/index.css'
import 'vant/lib/icon/index.css'
import 'vant/lib/loading/index.css'

// 导入全局样式
import './style.css'

// 引入国际化
import { setupI18n } from './i18n'

export function createApp(initialState, { ssr = true } = {}) {
  const app = ssr ? createSSRApp(App) : createVueApp(App)
  const pinia = createAppStore()
  if (initialState?.news) {
    pinia.state.value.news = initialState.news
  }
  const router = createAppRouter(pinia)
  const i18n = setupI18n()

  app.use(i18n)
  app.use(Button)
  app.use(NavBar)
  app.use(Tabbar)
  app.use(TabbarItem)
  app.use(Tab)
  app.use(Tabs)
  app.use(List)
  app.use(PullRefresh)
  app.use(Cell)
  app.use(CellGroup)
  app.use(Grid)
  app.use(GridItem)
  app.use(Empty)
  app.use(Form)
  app.use(Field)
  app.use(VanImage)
  app.use(Toast)
  app.use(Icon)
  app.use(Popup)
  app.use(Loading)

  app.use(pinia)
  app.use(router)

  return { app, router, pinia }
}
