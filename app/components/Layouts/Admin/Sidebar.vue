<script setup>
import { computed } from 'vue'
import { useRoute } from 'vue-router'

const isSidebarOpen = useState('adminSidebarOpen')
const route = useRoute()
const isActive = (path) => route.path.startsWith(path)

const mainMenus = [
  { label: 'Dashboard', to: '/admin/dashboard', icon: 'pi pi-chart-bar' },
  { label: 'Category', to: '/admin/categories', icon: 'pi pi-th-large' },
  { label: 'Sub Category', to: '/admin/sub-categories', icon: 'pi pi-list' },
  { label: 'Position', to: '/admin/positions', icon: 'pi pi-id-card' },
  { label: 'Question Bank', to: '/admin/question-bank', icon: 'pi pi-book' },
  { label: 'Packet', to: '/admin/packets', icon: 'pi pi-box' },
  { label: 'Packet Previews', to: '/admin/packet-previews', icon: 'pi-file-check' },
  { label: 'Transactions', to: '/admin/transactions', icon: 'pi pi-shopping-cart' },
  { label: 'User', to: '/admin/users', icon: 'pi pi-user' },
  { label: 'Reviews', to: '/admin/reviews', icon: 'pi pi-star' },
]

const getMenuClass = (menuPath) =>
  computed(() =>
    isActive(menuPath)
      ? 'bg-tryout-primary text-white shadow-md'
      : 'text-tryout-muted hover:bg-tryout-hover hover:text-tryout-text'
  )

// ✅ Fungsi untuk menutup sidebar setelah diklik (Khusus Mobile)
const handleMenuClick = () => {
  if (window.innerWidth < 768) {
    isSidebarOpen.value = false
  }
}
</script>

<template>
  <aside
    class="w-64 bg-tryout-sidebar fixed top-16 bottom-0 left-0 z-40 flex-shrink-0 overflow-y-auto shadow-xl border-r border-tryout-border transition-transform duration-300 ease-in-out"
    :class="isSidebarOpen ? 'translate-x-0' : '-translate-x-full'"
  >
    <nav class="p-4 pt-6">
      <section>
        <ul class="flex flex-col gap-2">
          <li v-for="item in mainMenus" :key="item.label">
            <NuxtLink
              :to="item.to"
              @click="handleMenuClick"
              class="flex items-center p-3 rounded-lg text-sm font-medium transition-all duration-200 ease-in-out"
              :class="getMenuClass(item.to).value"
            >
              <i :class="['w-5 h-5 mr-3 transition-transform duration-200 flex items-center justify-center', item.icon]" />
              {{ item.label }}
            </NuxtLink>
          </li>
        </ul>
      </section>
    </nav>
  </aside>
</template>

<style scoped>
aside::-webkit-scrollbar { width: 5px; }
aside::-webkit-scrollbar-track { background: transparent; }
aside::-webkit-scrollbar-thumb { background: var(--color-tryout-border); border-radius: 10px; }
aside::-webkit-scrollbar-thumb:hover { background: var(--color-tryout-muted); }

a:hover i {
  transform: scale(1.15);
}
</style>