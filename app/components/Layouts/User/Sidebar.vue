<script setup>
import { ref } from 'vue'
import { useRoute } from 'vue-router'

const route = useRoute()
const sidebarCollapsed = ref(false)

const isActive = (path) => route.path === path || route.path.startsWith(path + '/')

const menus = ref([
  { label: 'Overview',   to: '/overview',   icon: 'pi pi-chart-bar' },
  { label: 'My Packets', to: '/my-packets', icon: 'pi pi-box', isOpen: false },
  { label: 'My Profile', to: '/profile',    icon: 'pi pi-user' },
  { label: 'Ulasan',     to: '/ulasan',     icon: 'pi pi-star-fill' }
])

const toggleSidebar = () => { sidebarCollapsed.value = !sidebarCollapsed.value }
const toggleSubMenu = (menu) => {
  if (sidebarCollapsed.value) sidebarCollapsed.value = false
  menu.isOpen = !menu.isOpen
}
</script>

<template>
  <!--
    Pembungkus: mengurus sticky + lebar (tanpa overflow),
    supaya tombol toggle di tepi tidak terpotong.
  -->
  <div
    :class="[
      'sticky top-[72px] h-[calc(100vh-72px)] flex-shrink-0 z-40 hidden md:block',
      'transition-all duration-300',
      sidebarCollapsed ? 'w-20' : 'w-64'
    ]"
  >
    <!-- Tombol toggle di tepi sidebar -->
    <button
      @click="toggleSidebar"
      :title="sidebarCollapsed ? 'Buka sidebar' : 'Tutup sidebar'"
      :aria-label="sidebarCollapsed ? 'Buka sidebar' : 'Tutup sidebar'"
      class="absolute -right-3 top-6 z-[60] w-6 h-6 rounded-full flex items-center justify-center
             border border-tryout-border bg-tryout-surface text-tryout-muted shadow-sm
             hover:text-tryout-accent hover:border-tryout-accent transition-colors"
    >
      <i :class="['pi text-[10px]', sidebarCollapsed ? 'pi-angle-right' : 'pi-angle-left']"></i>
    </button>

    <aside class="h-full flex flex-col overflow-y-auto bg-tryout-sidebar border-r border-tryout-border">

      <!-- ── Nav items ── -->
      <nav class="p-3 flex-1">
        <p
          v-if="!sidebarCollapsed"
          class="px-3 pb-2 text-[10px] font-bold uppercase tracking-widest text-tryout-subtle"
        >
          Menu
        </p>

        <ul class="flex flex-col gap-1">
          <li v-for="menu in menus" :key="menu.label">

            <!-- Item tanpa submenu -->
            <NuxtLink
              v-if="!menu.children"
              :to="menu.to"
              :title="sidebarCollapsed ? menu.label : ''"
              :class="[
                'relative flex items-center p-3 rounded-xl text-sm font-medium transition-all duration-200',
                isActive(menu.to)
                  ? 'bg-tryout-accent/10 text-tryout-accent ring-1 ring-tryout-accent/20'
                  : 'text-tryout-muted hover:bg-tryout-hover hover:text-tryout-text'
              ]"
            >
              <!-- Left accent bar -->
              <span
                v-if="isActive(menu.to) && !sidebarCollapsed"
                class="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 bg-tryout-accent rounded-r-full"
              ></span>

              <!-- Icon -->
              <i
                :class="[
                  'text-base transition-colors',
                  menu.icon,
                  sidebarCollapsed ? 'mx-auto' : 'mr-3',
                  isActive(menu.to) ? 'text-tryout-accent' : ''
                ]"
              />

              <!-- Label -->
              <span v-if="!sidebarCollapsed" class="whitespace-nowrap">{{ menu.label }}</span>

              <!-- Dot indicator collapsed + active -->
              <span
                v-if="sidebarCollapsed && isActive(menu.to)"
                class="absolute top-2 right-2 w-1.5 h-1.5 bg-tryout-accent rounded-full"
              ></span>
            </NuxtLink>

            <!-- Item dengan submenu -->
            <div v-else>
              <button
                @click="toggleSubMenu(menu)"
                :title="sidebarCollapsed ? menu.label : ''"
                :class="[
                  'w-full flex items-center p-3 rounded-xl text-sm font-medium transition-all duration-200',
                  isActive(menu.to) || menu.isOpen
                    ? 'bg-tryout-hover text-tryout-text'
                    : 'text-tryout-muted hover:bg-tryout-hover hover:text-tryout-text'
                ]"
              >
                <i :class="['text-base', menu.icon, sidebarCollapsed ? 'mx-auto' : 'mr-3']" />
                <span v-if="!sidebarCollapsed" class="flex-1 text-left whitespace-nowrap">{{ menu.label }}</span>
                <i
                  v-if="!sidebarCollapsed"
                  :class="['pi text-xs transition-transform duration-200', menu.isOpen ? 'pi-chevron-down' : 'pi-chevron-right']"
                />
              </button>

              <!-- Submenu items -->
              <ul
                v-show="menu.isOpen && !sidebarCollapsed"
                class="mt-1 ml-4 pl-4 flex flex-col gap-0.5 border-l-2 border-tryout-border"
              >
                <li v-for="child in menu.children" :key="child.label">
                  <NuxtLink
                    :to="child.to"
                    :class="[
                      'relative block p-2 rounded-lg text-sm font-medium transition-colors',
                      route.path === child.to
                        ? 'bg-tryout-accent/10 text-tryout-accent font-semibold'
                        : 'text-tryout-muted hover:text-tryout-text hover:bg-tryout-hover'
                    ]"
                  >
                    {{ child.label }}
                  </NuxtLink>
                </li>
              </ul>
            </div>

          </li>
        </ul>
      </nav>

      <!-- ── Footer branding ── -->
      <div
        v-if="!sidebarCollapsed"
        class="p-4 border-t border-tryout-divider"
      >
        <p class="text-[10px] text-center font-medium tracking-widest uppercase text-tryout-subtle">
          Nyoba ASN
        </p>
      </div>
    </aside>
  </div>
</template>

<style scoped>
/* Scrollbar pakai CSS var langsung */
aside::-webkit-scrollbar       { width: 4px; }
aside::-webkit-scrollbar-track { background: transparent; }
aside::-webkit-scrollbar-thumb { background: var(--color-tryout-border); border-radius: 4px; }
aside::-webkit-scrollbar-thumb:hover { background: var(--color-tryout-muted); }
</style>