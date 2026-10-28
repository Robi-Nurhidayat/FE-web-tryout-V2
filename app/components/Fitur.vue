<script setup>
import { reactive } from 'vue';

// Pastikan untuk mengimpor 'reactive' karena Anda menggunakannya.
// Meskipun di Vue 3 Composition API dengan <script setup>, 'reactive' sudah otomatis tersedia
// jika Anda menggunakan Vite/Vue CLI, memuatnya secara eksplisit adalah praktik yang baik.

const features = reactive([
    {
        title: "Simulasi CAT",
        description: "Interface dan sistem yang sangat mirip dengan CAT CPNS asli untuk pengalaman yang autentik",
  
        icon: "pi-desktop"
    },
    {
        title: "Akses Fleksibel",
        description: "Pengerjaan kapan saja dan dimana saja sesuai dengan kenyamanan Anda",
        icon: "pi-clock"
    },
    {
        title: "Pembahasan Soal",
        description: "Setiap soal dilengkapi dengan pembahasan yang mudah dipahami dan tips praktis",
        icon: "pi-lightbulb"
    },

])

</script>

<template>
  <section id="fitur" class=" py-10">
    <div class="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
      <div class="text-center mb-16 ">
        <h2 class="text-3xl font-bold text-navy mb-4">
          Mengapa Memilih Try Out Kami?
        </h2>
        <p class="text-xl text-elegant max-w-2xl mx-auto">
          Keunggulan yang membuat try out kami menjadi pilihan terbaik untuk
          persiapan CPNS
        </p>
      </div>

      <div class="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
        <div 
          class="shadow bg-white p-8 rounded-xl " 
          v-for="item in features" 
          :key="item.title"
        >
          <div class=" bg-[#C0C9EE] opacity-85 flex items-center justify-center rounded w-[43px] h-[43px] mb-2 text-white text-lg">
            <i class="pi text-blue-700" :class="item.icon"></i>
          </div>
          <h3 class="text-xl font-semibold text-navy mb-4">
            {{ item.title }}
          </h3>
          <p class="text-elegant">
          {{ item.description }}
          </p>
        </div>
        
        </div>
    </div>
  </section>
</template>