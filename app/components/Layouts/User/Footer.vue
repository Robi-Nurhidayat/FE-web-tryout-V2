<script setup>
// Tidak ada logika khusus untuk footer, 
// tapi disiapkan supaya nanti bisa dinamis (misal ambil data sosial media dari API)
</script>

<template>
  <footer class="bg-[#202040] text-white py-10">
    <div class="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
      <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-10">
        <!-- Brand Info -->
        <div>
          <h2 class="text-2xl font-bold text-indigo-400 mb-3">CPNS Try Out</h2>
          <p class="text-sm leading-relaxed text-gray-200">
            Platform latihan ujian CPNS terpercaya dengan beragam paket try out berkualitas.
            Bantu kamu siap menghadapi seleksi dengan percaya diri!
          </p>
        </div>

        <!-- Product Links -->
        <div>
          <h3 class="text-lg font-semibold mb-4 border-l-4 border-indigo-400 pl-2">Katalog</h3>
          <ul class="space-y-2 text-gray-300 text-sm">
            <li><a href="#" class="hover:text-indigo-400 transition-colors duration-200">Try Out Basic</a></li>
            <li><a href="#" class="hover:text-indigo-400 transition-colors duration-200">Try Out Premium</a></li>
            <li><a href="#" class="hover:text-indigo-400 transition-colors duration-200">Try Out Ultimate</a></li>
            <li><a href="#" class="hover:text-indigo-400 transition-colors duration-200">Try Out PPPK</a></li>
          </ul>
        </div>

        <!-- Contact Info -->
        <div>
          <h3 class="text-lg font-semibold mb-4 border-l-4 border-indigo-400 pl-2">Kontak Kami</h3>
          <ul class="text-gray-300 text-sm space-y-2">
            <li><i class="pi pi-envelope mr-2 text-indigo-400"></i> info@cpnstryout.com</li>
            <li><i class="pi pi-phone mr-2 text-indigo-400"></i> +62 812-3456-7890</li>
            <li><i class="pi pi-clock mr-2 text-indigo-400"></i> Senin–Jumat, 09:00–17:00</li>
            <li><i class="pi pi-map-marker mr-2 text-indigo-400"></i> Jakarta, Indonesia</li>
          </ul>
        </div>

        <!-- Help Links -->
        <div>
          <h3 class="text-lg font-semibold mb-4 border-l-4 border-indigo-400 pl-2">Bantuan</h3>
          <ul class="space-y-2 text-gray-300 text-sm">
            <li><a href="#" class="hover:text-indigo-400 transition-colors duration-200">Cara Pemesanan</a></li>
            <li><a href="#" class="hover:text-indigo-400 transition-colors duration-200">Panduan Pembayaran</a></li>
            <li><a href="#" class="hover:text-indigo-400 transition-colors duration-200">FAQ</a></li>
            <li><a href="#" class="hover:text-indigo-400 transition-colors duration-200">Syarat & Ketentuan</a></li>
          </ul>
        </div>
      </div>

      <!-- Divider -->
      <div class="border-t border-indigo-500/20 mt-10 pt-6 text-center">
        <p class="text-sm text-gray-400">
          © {{ new Date().getFullYear() }} CPNS Try Out — Semua hak dilindungi undang-undang.
        </p>
      </div>
    </div>
  </footer>
</template>

<style scoped>
footer a {
  position: relative;
}
footer a::after {
  content: '';
  position: absolute;
  left: 0;
  bottom: -2px;
  width: 0%;
  height: 2px;
  background-color: #818cf8; /* indigo-400 */
  transition: width 0.25s ease;
}
footer a:hover::after {
  width: 100%;
}
</style>
