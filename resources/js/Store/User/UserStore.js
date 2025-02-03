import { defineStore } from 'pinia';
import axios from 'axios';
import { toast } from 'vue3-toastify';
import { useInvestModalStore } from '../Modal/InvestStore';
import { useSystemStore } from '../System/SystemStore';
export const useUserStore = defineStore('user', {
    state: () => ({
        user: null,
        balance: 0,
        

    }),
    actions: {
        async fetchUser(id) {
            const response = await axios.get(`/api/user/get/${id}`);
            this.user = response.data;
            this.balance = response.data.balance;
        },
        async fetchBalance() {
            const response = await axios.get(`/api/user/balance/${this.user.id}`);
            this.balance = response.data.balance;
        },
        async addBalance(amount) {
            this.balance += amount;
            await axios.post(`/api/user/add-balance`, { amount });
        },
        async removeBalance(amount) {
            this.balance -= amount;
        },
        async withdraw(deal_id) {
            try {
                const response = await axios.post(`/api/withdraw`, { deal_id, user_id: this.user.id });
                if(response.status === 200) {
                    toast("Вывод средств прошел успешно", {
                    type: "success"
                });
                const systemStore = useSystemStore();
                    this.fetchBalance();
                    systemStore.fetchDeals();
                }
            } catch(error) {
                toast(error.response.data.message, {
                    type: "error"
                });
            }
        },
        async invest(bundle, amount) {
            if(amount < bundle.min_deposit) {
                toast("Минимальная сумма инвестиции " + bundle.min_deposit + " usdt", {
                    type: "error"
                });
                return;
            }
            const user = useUserStore();
            const modalStore = useInvestModalStore();
            const systemStore = useSystemStore();
            const response = await axios.post(`/api/user/invest`, { bundle_id: bundle.id, amount: amount, user_id: user.user.id });
            
            if(response.status === 200) {
                toast("Инвестиция прошла успешно", {
                    type: "success"
                });
                systemStore.fetchDeals();
                this.fetchBalance();
                modalStore.closeModal();

            }
        }
    }
});
