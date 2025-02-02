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
});

</script>
<template>
    <header class="py-5 w-full flex justify-center">

        <div class="relative w-fit">
            <div class="absolute -top-3 left-full ml-1">
                <div class="border border-gray-200 rounded-lg text-xs font-bold p-1 whitespace-nowrap">
                    {{ userStore?.balance || 0 }} $
                </div>
            </div>

            <div class="inline-flex justify-center rounded-md shadow-xs " role="group">
                <button type="button" @click="systemStore.setActiveTab('work')"
                    :class="{ 'bg-gray-100 text-blue-700  ': systemStore.activeTab === 'work' }"
                    class="inline-flex justify-center  items-center px-4 py-2 text-sm font-medium transition-all duration-300 bg-white border border-gray-200 rounded-s-lg hover:bg-gray-100 hover:text-blue-700 focus:z-10  dark:bg-gray-800 dark:border-gray-700 dark:text-white dark:hover:text-white dark:hover:bg-gray-700 dark:focus:ring-blue-500 dark:focus:text-white">
                    <svg class="w-3 h-3 me-2" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="currentColor"
                        viewBox="0 0 20 20">
                        <path
                            d="M10 0a10 10 0 1 0 10 10A10.011 10.011 0 0 0 10 0Zm0 5a3 3 0 1 1 0 6 3 3 0 0 1 0-6Zm0 13a8.949 8.949 0 0 1-4.951-1.488A3.987 3.987 0 0 1 9 13h2a3.987 3.987 0 0 1 3.951 3.512A8.949 8.949 0 0 1 10 18Z" />
                    </svg>
                    В работе
                </button>

                <button type="button" @click="systemStore.setActiveTab('invest')"
                    :class="{ 'bg-gray-100 text-blue-700 ': systemStore.activeTab === 'invest' }"
                    class="inline-flex justify-center   items-center px-4 py-2 text-sm font-medium transition-all duration-300 bg-white border border-gray-200 rounded-e-lg hover:bg-gray-100 hover:text-blue-700 focus:z-10 dark:bg-gray-800 dark:border-gray-700 dark:text-white dark:hover:text-white dark:hover:bg-gray-700 dark:focus:ring-blue-500 dark:focus:text-white">
                    <svg class="w-4 h-4 me-1" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="currentColor"
                        viewBox="0 0 24 24">
                        <path
                            d="M8.597 3.2A1 1 0 0 0 7.04 4.289a3.49 3.49 0 0 1 .057 1.795 3.448 3.448 0 0 1-.84 1.575.999.999 0 0 0-.077.094c-.596.817-3.96 5.6-.941 10.762l.03.049a7.73 7.73 0 0 0 2.917 2.602 7.617 7.617 0 0 0 3.772.829 8.06 8.06 0 0 0 3.986-.975 8.185 8.185 0 0 0 3.04-2.864c1.301-2.2 1.184-4.556.588-6.441-.583-1.848-1.68-3.414-2.607-4.102a1 1 0 0 0-1.594.757c-.067 1.431-.363 2.551-.794 3.431-.222-2.407-1.127-4.196-2.224-5.524-1.147-1.39-2.564-2.3-3.323-2.788a8.487 8.487 0 0 1-.432-.287Z" />
                    </svg>


                    Все связки
                </button>
            </div>

        </div>

    </header>
</template>