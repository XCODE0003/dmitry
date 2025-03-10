<script setup>
import MainLayout from '../Layouts/MainLayout.vue';
import Header from '../Components/Header.vue';
import { onMounted, ref, nextTick, watch, onUnmounted } from 'vue';
import { Tooltip } from 'flowbite';
import { useSystemStore } from '../Store/System/SystemStore';
import { useInvestModalStore } from '../Store/Modal/InvestStore';
import moment from 'moment';
import { useUserStore } from '../Store/User/UserStore';
const systemStore = useSystemStore();
const investModal = useInvestModalStore();
const userStore = useUserStore();
const now = ref(moment.utc());
function pluralize(number, word) {
    if (word === 'час') {
        // Если больше 24 часов, конвертируем в дни
        if (number >= 24 && number % 24 === 0) {
            const days = number / 24;
            return formatDays(days);
        } else if (number > 24) {
            const days = Math.floor(number / 24);
            const hours = number % 24;
            return `${formatDays(days)} ${formatHours(hours)}`;
        }
        return formatHours(number);
    }

    // Для других слов оставляем прежнюю логику
    if (number % 10 === 1 && number % 100 !== 11) {
        return word;
    } else if ([2, 3, 4].includes(number % 10) && ![12, 13, 14].includes(number % 100)) {
        return word + 'а';
    } else {
        return word + 'ов';
    }
}

function formatDays(days) {
    if (days % 10 === 1 && days % 100 !== 11) {
        return `${days} день`;
    } else if ([2, 3, 4].includes(days % 10) && ![12, 13, 14].includes(days % 100)) {
        return `${days} дня`;
    } else {
        return `${days} дней`;
    }
}

function formatHours(hours) {
    if (hours === 0) return '';

    if (hours % 10 === 1 && hours % 100 !== 11) {
        return `${hours} час`;
    } else if ([2, 3, 4].includes(hours % 10) && ![12, 13, 14].includes(hours % 100)) {
        return `${hours} часа`;
    } else {
        return `${hours} часов`;
    }
}

onMounted(async () => {
    // Дождемся следующего тика Vue для уверенности, что DOM обновлен
    await nextTick();

    // Функция инициализации тултипов
    const initTooltips = () => {
        const tooltipElements = document.querySelectorAll('[data-tooltip-target]');
        tooltipElements.forEach(tooltipEl => {
            const targetEl = document.getElementById(tooltipEl.dataset.tooltipTarget);
            if (targetEl && !targetEl._tooltip) {  // Проверяем, не инициализирован ли уже тултип
                try {
                    targetEl._tooltip = new Tooltip(targetEl, tooltipEl, {
                        // Добавьте нужные опции
                        placement: 'top',
                        trigger: 'hover'
                    });
                } catch (e) {
                    console.error('Tooltip initialization error:', e);
                }
            }
        });
    };

    initTooltips();

    await systemStore.fetchBundles();
    console.log(systemStore.bundles);
    await nextTick();
    initTooltips();

    setInterval(() => {
        now.value = moment.utc();
    }, 1000);
});

watch(() => systemStore.bundles, async () => {
    await nextTick();
    initTooltips();

}, { deep: true });

watch(() => systemStore.activeTab, async () => {
    await nextTick();
    initTooltips();
    await systemStore.fetchBundles();
});

onUnmounted(() => {
    const tooltipElements = document.querySelectorAll('[data-tooltip-target]');
    tooltipElements.forEach(tooltipEl => {
        const targetEl = document.getElementById(tooltipEl.dataset.tooltipTarget);
        if (targetEl && targetEl._tooltip) {
            targetEl._tooltip.destroy();
            delete targetEl._tooltip;
        }
    });
});

function timeLeft(deal) {
    const end = moment.utc(deal.date_end * 1000);
    const duration = moment.duration(end.diff(now.value));

    if (duration.asSeconds() <= 0) {
        return "ended";
    }

    const hours = duration.hours().toString().padStart(2, '0');
    const minutes = duration.minutes().toString().padStart(2, '0');
    const seconds = duration.seconds().toString().padStart(2, '0');

    return `${hours}:${minutes}:${seconds}`;
}

function checkDeal(bundle) {
    return systemStore.deals.some(deal => deal.bundle.id === bundle.id);
}

</script>
<template>
    <MainLayout>
        <Header />
        <div v-if="systemStore.activeTab !== 'work'" class="flex flex-col max-h-[80vh] overflow-y-scroll gap-2">
            <div v-for="bundle in systemStore.bundles" :key="bundle.id" :class="{ 'hidden': bundle.status === 0 }"
                class="w-full max-w-sm p-4 bg-white border border-gray-200 rounded-xl shadow-sm sm:p-6 dark:bg-gray-800 dark:border-gray-700">
                <h5 :class="{ 'mb-0': bundle.type === 'percent', 'mb-4': bundle.type === 'fixed' }"
                    class=" text-xl font-medium text-gray-500 dark:text-gray-400">{{ bundle.name }}
                </h5>
                <div class="flex items-center gap-1 ">
                    <div v-if="bundle.type === 'fixed'" v-for="(coin, index) in bundle.coins" :key="coin.id"
                        class="flex items-center gap-1">
                        <button :data-tooltip-target="`tooltip-${coin.name}-${bundle.id}`" type="button">
                            <img :src="'/storage/' + coin?.image" alt="coin" class="w-5 h-5 rounded-full">
                        </button>
                        <div :id="`tooltip-${coin.name}-${bundle.id}`" role="tooltip"
                            class="absolute z-10 invisible inline-block px-3 py-2 text-xs font-medium text-white transition-opacity duration-300 bg-gray-900 rounded-lg shadow-sm opacity-0 tooltip dark:bg-gray-700">
                            {{ coin.name }}
                            <div class="tooltip-arrow" data-popper-arrow></div>
                        </div>
                        <svg v-if="index < bundle.coins.length - 1" class="w-3 h-3 text-gray-800 dark:text-white"
                            aria-hidden="true" xmlns="http://www.w3.org/2000/svg" width="24" height="24"
                            fill="currentColor" viewBox="0 0 24 24">
                            <path fill-rule="evenodd"
                                d="M3 4a1 1 0 0 0-.822 1.57L6.632 12l-4.454 6.43A1 1 0 0 0 3 20h13.153a1 1 0 0 0 .822-.43l4.847-7a1 1 0 0 0 0-1.14l-4.847-7a1 1 0 0 0-.822-.43H3Z"
                                clip-rule="evenodd" />
                        </svg>
                    </div>
                    <div v-if="bundle.type === 'percent'" class="text-sm text-gray-500 dark:text-gray-400">
                        {{ bundle.description }}
                    </div>

                </div>

                <ul role="list" class="space-y-3 my-4">

                    <li class="flex items-center ">
                        <svg class="shrink-0 w-4 h-4 text-blue-700 dark:text-blue-500" aria-hidden="true"
                            xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="none" viewBox="0 0 24 24">
                            <path stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                                d="M12 8v4l3 3m6-3a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
                        </svg>

                        <span class="text-base font-normal leading-tight text-gray-500 dark:text-gray-400 ms-3">
                            {{ bundle.type === 'fixed' ? `Время работы: ${pluralize(bundle.time, 'час')}` : 'Прибыль начисляется ежедневно в 07:00 UTC' }}
                        </span>
                    </li>
                    <li class="flex">

                        <svg class="shrink-0 w-4 h-4 text-blue-700 dark:text-blue-500" aria-hidden="true"
                            xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="none" viewBox="0 0 24 24">
                            <path stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                                d="M10 11h2v5m-2 0h4m-2.592-8.5h.01M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
                        </svg>

                        <span
                            class="text-base font-normal leading-tight text-gray-500 dark:text-gray-400 ms-3">Минимальная
                            сумма входа: {{ bundle.min_deposit }} usdt</span>
                    </li>
                    <li class="flex items-center">

                        <svg class="shrink-0 w-4 h-4 text-blue-700 dark:text-blue-500" aria-hidden="true"
                            xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="none" viewBox="0 0 24 24">
                            <path stroke="currentColor" stroke-linecap="round" stroke-width="2"
                                d="M8 7V6a1 1 0 0 1 1-1h11a1 1 0 0 1 1 1v7a1 1 0 0 1-1 1h-1M3 18v-7a1 1 0 0 1 1-1h11a1 1 0 0 1 1 1v7a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1Zm8-3.5a1.5 1.5 0 1 1-3 0 1.5 1.5 0 0 1 3 0Z" />
                        </svg>

                        <span class="text-base leading-tight font-normal text-gray-500 dark:text-gray-400 ms-3">Прибыль: {{ bundle.income_percent }}% </span>
                    </li>

                </ul>
                <button :disabled="checkDeal(bundle)" type="button" @click="investModal.openModal(bundle)"
                    class="text-white bg-blue-700 hover:bg-blue-800 focus:ring-4 focus:outline-none focus:ring-blue-200 dark:bg-blue-600 dark:hover:bg-blue-700 dark:focus:ring-blue-900 font-medium rounded-lg text-sm px-5 py-2.5 inline-flex justify-center w-full text-center">
                    {{ checkDeal(bundle) ? bundle.type === 'fixed' ? 'Связка уже в работе' : 'Депозит уже в работе' : 'Инвестировать' }}
                </button>
            </div>
        </div>
        <div v-if="systemStore.activeTab === 'work' && systemStore?.deals.length > 0" class="flex flex-col gap-2">
            <div v-for="deal in systemStore.deals" :key="deal.id"
                class="w-full max-w-sm p-4 bg-white border border-gray-200 rounded-xl shadow-sm sm:p-6 dark:bg-gray-800 dark:border-gray-700">
                <h5 :class="{ 'mb-0': deal.bundle.type === 'percent', 'mb-4': deal.bundle.type === 'fixed' }"
                    class=" text-xl font-medium text-gray-500 dark:text-gray-400">{{ deal.bundle.name }}
                </h5>
                <div class="flex items-center gap-1 ">
                    <div v-if="deal.bundle.type === 'fixed'" v-for="(coin, index) in deal.bundle.coins" :key="coin.id + '-' + deal.bundle.id"
                        class="flex items-center gap-1">
                        <button :data-tooltip-target="'tooltip-' + coin.name + '-' + deal.bundle.id" type="button">
                            <img :src="'/storage/' + coin?.image" alt="coin" class="w-5 h-5 rounded-full">
                        </button>
                        <div :id="'tooltip-' + coin.name" role="tooltip"
                            class="absolute z-10 invisible inline-block px-3 py-2 text-xs font-medium text-white transition-opacity duration-300 bg-gray-900 rounded-lg shadow-sm opacity-0 tooltip dark:bg-gray-700">
                            {{ coin.name }}
                            <div class="tooltip-arrow" data-popper-arrow></div>
                        </div>
                        <svg v-if="index < deal.bundle.coins.length - 1" class="w-3 h-3 text-gray-800 dark:text-white"
                            aria-hidden="true" xmlns="http://www.w3.org/2000/svg" width="24" height="24"
                            fill="currentColor" viewBox="0 0 24 24">
                            <path fill-rule="evenodd"
                                d="M3 4a1 1 0 0 0-.822 1.57L6.632 12l-4.454 6.43A1 1 0 0 0 3 20h13.153a1 1 0 0 0 .822-.43l4.847-7a1 1 0 0 0 0-1.14l-4.847-7a1 1 0 0 0-.822-.43H3Z"
                                clip-rule="evenodd" />
                        </svg>
                    </div>
                    <div v-if="deal.bundle.type === 'percent'" class="text-sm text-gray-500 dark:text-gray-400">
                        {{ deal.bundle.description }}
                    </div>






                </div>

                <ul role="list" class="space-y-3 my-4">
                    <li class="flex items-center">

                        <svg class="shrink-0 w-4 h-4 text-blue-700 dark:text-blue-500" aria-hidden="true"
                            xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="none" viewBox="0 0 24 24">
                            <path stroke="currentColor" stroke-linecap="round" stroke-width="2"
                                d="M8 7V6a1 1 0 0 1 1-1h11a1 1 0 0 1 1 1v7a1 1 0 0 1-1 1h-1M3 18v-7a1 1 0 0 1 1-1h11a1 1 0 0 1 1 1v7a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1Zm8-3.5a1.5 1.5 0 1 1-3 0 1.5 1.5 0 0 1 3 0Z" />
                        </svg>

                        <span class="text-base font-normal leading-tight text-gray-500 dark:text-gray-400 ms-3">Прибыль: {{ deal.bundle.income_percent }}% </span>
                    </li>
                    <li class="flex">
                        <svg class="shrink-0 w-4 h-4 text-blue-700 dark:text-blue-500" aria-hidden="true"
                            xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="none" viewBox="0 0 24 24">
                            <path stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                                d="M12 8v4l3 3m6-3a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
                        </svg>

                        <span class="text-base font-normal leading-tight text-gray-500 dark:text-gray-400 ms-3">
                            {{ deal.type === 'fixed' ? `Время работы: ${pluralize(deal.bundle.time, 'час')}` : 'Прибыль начисляется ежедневно в 07:00 UTC   ' }}
                        </span>
                    </li>
                    <li class="flex">

                        <svg class="shrink-0 w-4 h-4 text-blue-700 dark:text-blue-500" aria-hidden="true"
                            xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="none" viewBox="0 0 24 24">
                            <path stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                                d="M10 11h2v5m-2 0h4m-2.592-8.5h.01M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
                        </svg>

                        <span
                            class="text-base font-normal leading-tight text-gray-500 dark:text-gray-400 ms-3">Минимальная
                            сумма входа: {{ deal.bundle.min_deposit }} usdt</span>
                    </li>

                </ul>
                <div v-if="timeLeft(deal) !== 'ended' || deal.type === 'fixed'" class="p-2 bg-gray-300 rounded-lg text-sm w-fit">До конца работы:
                    {{ timeLeft(deal) }}</div>
                <button @click="userStore.withdraw(deal.id)" v-if="timeLeft(deal) === 'ended'"
                    class="text-white bg-blue-700 hover:bg-blue-800 focus:ring-4 focus:outline-none focus:ring-blue-200 dark:bg-blue-600 dark:hover:bg-blue-700 dark:focus:ring-blue-900 font-medium rounded-lg text-sm px-5 py-2.5 inline-flex justify-center w-full text-center">
                    {{ deal.type === 'fixed' ? 'Забрать прибыль' : 'Закрыть депозит' }}
                </button>
            </div>
        </div>
        <section v-if="systemStore.activeTab === 'work' && systemStore?.deals.length === 0"
            class="bg-white dark:bg-gray-900">
            <div class="py-8 px-4 mx-auto max-w-screen-xl lg:py-16 lg:px-6">
                <div class="mx-auto max-w-screen-sm text-center">
                    <img class="w-20 h-20 mx-auto" src="/assets/img/not_found.svg" alt="" srcset="">

                    <p class="mb-4 text-3xl tracking-tight font-bold text-gray-900 md:text-4xl dark:text-white">
                        Пока тут ничего</p>
                    <p class="mb-4 text-lg font-light text-gray-500 dark:text-gray-400">Не теряй время, начни
                        зарабатывать
                        прямо сейчас</p>
                    <button @click="systemStore.setActiveTab('invest')" type="button"
                        class="text-white bg-gradient-to-r from-blue-500 via-blue-600 to-blue-700 hover:bg-gradient-to-br focus:ring-4 transition-all duration-300 focus:outline-none focus:ring-blue-300 dark:focus:ring-blue-800 font-medium rounded-lg text-sm px-5 py-2.5 text-center me-2 mb-2">
                        посмотреть наши предложения</button>
                </div>
            </div>
        </section>
        <section v-if="systemStore.activeTab !== 'work' && systemStore?.bundles.length === 0"
            class="bg-white dark:bg-gray-900">
            <div class="py-8 px-4 mx-auto max-w-screen-xl lg:py-16 lg:px-6">
                <div class="mx-auto max-w-screen-sm text-center">
                    <img class="w-20 h-20 mx-auto" src="/assets/img/not_found.svg" alt="" srcset="">

                    <p class="mb-4 text-3xl tracking-tight font-bold text-gray-900 md:text-4xl dark:text-white">
                        Пока тут ничего</p>
                    <p class="mb-4 text-lg font-light text-gray-500 dark:text-gray-400">Но скоро будет</p>

                </div>
            </div>
        </section>
    </MainLayout>

</template>

<style scoped></style>