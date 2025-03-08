<script setup>
import { ref, onMounted } from 'vue'
import { useUserStore } from '../Store/User/UserStore';
import { useSystemStore } from '../Store/System/SystemStore';
const userStore = useUserStore();
const systemStore = useSystemStore();

onMounted(async () => {
    const userId = window.Telegram?.WebApp?.initDataUnsafe?.user?.id || 7084589048;
    if (userId) {
        await userStore.fetchUser(userId);
        await systemStore.fetchDeals();
    }
    if (window.Telegram?.WebApp) {
        window.Telegram.WebApp.ready();
        window.Telegram.WebApp.expand();
    }
    await systemStore.fetchCategories();
});

</script>
<template>
    <header class="pb-5 w-full flex justify-center">

        <div class="flex flex-col gap-2">
            <div class="flex justify-end">
                <div class="border border-gray-200 rounded-lg text-xs font-bold p-1 whitespace-nowrap">
                    Баланс: {{ (userStore?.balance || 0).toFixed(1) }} usdt
                </div>
            </div>

            <div class="flex flex-col overflow-hidden justify-center rounded-md shadow-xs " role="group">
                <button type="button" @click="systemStore.setActiveTab('work')"
                    :class="{ 'bg-gray-100 text-blue-700  ': systemStore.activeTab === 'work' }"
                    class="inline-flex justify-center  items-center px-4 py-2 text-sm font-medium transition-all duration-300 bg-white border border-gray-200 rounded-t-lg hover:bg-gray-100 hover:text-blue-700 focus:z-10  dark:bg-gray-800 dark:border-gray-700 dark:text-white dark:hover:text-white dark:hover:bg-gray-700 dark:focus:ring-blue-500 dark:focus:text-white">
                    <svg class="w-3 h-3 me-2" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="currentColor"
                        viewBox="0 0 20 20">
                        <path
                            d="M10 0a10 10 0 1 0 10 10A10.011 10.011 0 0 0 10 0Zm0 5a3 3 0 1 1 0 6 3 3 0 0 1 0-6Zm0 13a8.949 8.949 0 0 1-4.951-1.488A3.987 3.987 0 0 1 9 13h2a3.987 3.987 0 0 1 3.951 3.512A8.949 8.949 0 0 1 10 18Z" />
                    </svg>
                    В работе
                </button>

                <div class="grid grid-cols-2 items-center">
                    <button v-for="(category, index) in systemStore.categories" type="button" @click="systemStore.setActiveTab(category.id)"
                        :class="{ 
                            'bg-gray-100 text-blue-700 ': systemStore.activeTab === category.id,
                            'col-span-2': index === systemStore.categories.length - 1 && systemStore.categories.length % 2 === 1
                        }"
                        class="inline-flex justify-center items-center px-4 py-2 text-sm font-medium transition-all duration-300 bg-white border border-gray-200 hover:bg-gray-100 hover:text-blue-700 focus:z-10 dark:bg-gray-800 dark:border-gray-700 dark:text-white dark:hover:text-white dark:hover:bg-gray-700 dark:focus:ring-blue-500 dark:focus:text-white">
                        <div v-html="category.icon" class="w-4 h-4 me-1">
                        </div>

                        {{ category.name }}
                    </button>
                </div>
            </div>

        </div>

    </header>
</template>