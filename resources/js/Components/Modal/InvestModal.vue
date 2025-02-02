<script setup>
import { useInvestModalStore } from '../../Store/Modal/InvestStore'
import { VueFinalModal } from 'vue-final-modal'
import { ref } from 'vue'
import { useUserStore } from '../../Store/User/UserStore'
const investModalStore = useInvestModalStore()
const userStore = useUserStore()


const amount = ref(null)

</script>
<template>
    <VueFinalModal v-model="investModalStore.modalConfig.modelValue"
        :teleport-to="investModalStore.modalConfig.teleportTo"
        :display-directive="investModalStore.modalConfig.displayDirective"
        :hide-overlay="investModalStore.modalConfig.hideOverlay"
        :overlay-transition="investModalStore.modalConfig.overlayTransition"
        :content-transition="investModalStore.modalConfig.contentTransition"
        :click-to-close="investModalStore.modalConfig.clickToClose"
        :esc-to-close="investModalStore.modalConfig.escToClose" :background="investModalStore.modalConfig.background"
        :lock-scroll="investModalStore.modalConfig.lockScroll"
        :reserve-scroll-bar-gap="investModalStore.modalConfig.reserveScrollBarGap"
        :swipe-to-close="investModalStore.modalConfig.swipeToClose" content-class="fixed bottom-0 max-w-[350px] mx-auto left-0 right-0">
        <div class="relative p-4 w-full bottom-0 min-w-[350px] max-w-md max-h-full">
            <div class="relative  bg-white rounded-2xl shadow-sm dark:bg-gray-700">
                <div
                    class="flex items-center justify-between p-4 md:p-5 border-b rounded-t dark:border-gray-600 border-gray-200">
                    <h3 class="text-lg font-semibold text-gray-900 dark:text-white">
                        Новый вклад
                    </h3>
                    <button @click="investModalStore.closeModal()" type="button"
                        class="text-gray-400 bg-transparent hover:bg-gray-200 hover:text-gray-900 rounded-lg text-sm w-8 h-8 ms-auto inline-flex justify-center items-center dark:hover:bg-gray-600 dark:hover:text-white">
                        <svg class="w-3 h-3" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="none"
                            viewBox="0 0 14 14">
                            <path stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                                d="m1 1 6 6m0 0 6 6M7 7l6-6M7 7l-6 6" />
                        </svg>
                        <span class="sr-only">Close modal</span>
                    </button>
                </div>
                <div class="p-4 md:p-5">
                    <div class="grid gap-4 mb-4 grid-cols-2">
                        <div class="col-span-2">
                            <label 
                                class="block mb-2 text-sm font-medium text-gray-900 dark:text-white">Сумма вклада</label>
                            <input type="text" name="name" id="name"
                                class="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-primary-600 focus:border-primary-600 block w-full p-2.5 dark:bg-gray-600 dark:border-gray-500 dark:placeholder-gray-400 dark:text-white dark:focus:ring-primary-500 dark:focus:border-primary-500"
                                placeholder="Введите сумму вклада" v-model="amount">
                        </div>
                      
                    </div>
                    <button @click="userStore.invest(investModalStore.modalConfig.bundle, amount)"
                        class="text-white w-full justify-center inline-flex items-center bg-blue-700 hover:bg-blue-800 focus:ring-4 focus:outline-none focus:ring-blue-300 font-medium rounded-lg text-sm px-5 py-2.5 text-center dark:bg-blue-600 dark:hover:bg-blue-700 dark:focus:ring-blue-800">
                       
                        Инвестировать
                    </button>
                </div>
            </div>
        </div>
    </VueFinalModal>
</template>
<style>
.Toastify__toast{
    border-radius: 8px;
}
</style>