import { defineStore } from 'pinia'
import { newsApi } from '../api'

const PAGE_SIZE = 10

function emptyHome() {
  return {
    items: [],
    categoryId: null,
    page: 1,
    hasMore: false,
    loaded: false
  }
}

export const useNewsStore = defineStore('news', {
  state: () => ({
    categories: [],
    home: emptyHome(),
    detail: null,
    detailId: null,
    detailStatus: null,
    loading: false
  }),
  actions: {
    async loadHome(force = false) {
      if (this.home.loaded && !force) return
      this.loading = true
      try {
        const categoriesResponse = await newsApi.getCategories()
        if (categoriesResponse.code !== 200) {
          throw new Error(categoriesResponse.message || '加载分类失败')
        }
        this.categories = categoriesResponse.data.filter((category) => category.id !== 1)
        if (!this.categories.length) {
          this.home = { ...emptyHome(), loaded: true }
          return
        }
        await this.loadCategory(this.categories[0].id, true)
      } finally {
        this.loading = false
      }
    },
    async loadCategory(categoryId, refresh = false) {
      if (this.loading && !refresh) return
      this.loading = true
      this.home = {
        items: [],
        categoryId,
        page: 1,
        hasMore: true,
        loaded: false
      }
      try {
        const response = await newsApi.getList({ categoryId, page: 1, pageSize: PAGE_SIZE })
        if (response.code !== 200) {
          throw new Error(response.message || '加载新闻失败')
        }
        this.home = {
          items: response.data.list || [],
          categoryId,
          page: 2,
          hasMore: Boolean(response.data.hasMore),
          loaded: true
        }
      } finally {
        this.loading = false
      }
    },
    async loadMore() {
      if (this.loading || !this.home.loaded || !this.home.hasMore) return
      this.loading = true
      try {
        const response = await newsApi.getList({
          categoryId: this.home.categoryId,
          page: this.home.page,
          pageSize: PAGE_SIZE
        })
        if (response.code !== 200) {
          throw new Error(response.message || '加载新闻失败')
        }
        this.home.items.push(...(response.data.list || []))
        this.home.page += 1
        this.home.hasMore = Boolean(response.data.hasMore)
      } finally {
        this.loading = false
      }
    },
    async loadDetail(id, force = false) {
      if (!force && this.detailId === id && (this.detail || this.detailStatus)) return
      this.detail = null
      this.detailId = id
      this.detailStatus = null
      try {
        const response = await newsApi.getDetail({ id })
        if (response.code !== 200) {
          throw new Error(response.message || '加载新闻详情失败')
        }
        this.detail = response.data
        this.detailStatus = 200
      } catch (error) {
        this.detailStatus = error.response?.status || 500
        if (this.detailStatus !== 404) throw error
      }
    }
  }
})
