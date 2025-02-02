<script setup>
import { ModalsContainer } from 'vue-final-modal'
import InvestModal from '../Components/Modal/InvestModal.vue'
</script>
<template >
    <div class="container py-5 mx-auto">
        <slot></slot>
    </div>
    <ModalsContainer />
    <InvestModal />
</template>

<style scoped>
    
</style>