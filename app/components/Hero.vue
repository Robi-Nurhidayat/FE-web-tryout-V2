<script setup></script>

<template>

      <section id="hero" class="pt-32 pb-16 bg-[#0D1164]/10">
        <div class="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
            <div class="grid lg:grid-cols-2 gap-12 items-center">
                <!-- Hero Content -->
                <div class="fade-in">
                    
                    <h1 class="text-4xl lg:text-5xl font-bold text-navy mb-6 leading-tight">
                        Try Out CPNS
                        <span class="text-accent">Berkualitas</span>
                        untuk Persiapan Optimal
                    </h1>
                    
                    <p class="text-xl text-elegant mb-8">
                        Kami menyediakan berbagai paket try out CPNS dengan simulasi CAT, 
                        bank soal, dan pembahasan soal.
                    </p>
                    
                    <!-- Key Points -->
                    <div class="space-y-3 mb-8">
                        <div class="flex items-center">
                            <svg class="w-5 h-5 text-green-500 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path>
                            </svg>
                            <span class="text-elegant">Simulasi CAT</span>
                        </div>
                        <div class="flex items-center">
                            <svg class="w-5 h-5 text-green-500 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path>
                            </svg>
                            <span class="text-elegant">Berbagai pilihan paket sesuai kebutuhan</span>
                        </div>
                        <div class="flex items-center">
                            <svg class="w-5 h-5 text-green-500 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path>
                            </svg>
                            <span class="text-elegant">Harga terjangkau dengan kualitas terjamin</span>
                        </div>
                    </div>

                    <div class="flex flex-col sm:flex-row gap-4">
                        <button class="bg-blue-500 cursor-pointer text-white font-medium py-3 px-8 rounded-lg">
                            Lihat Katalog Try Out
                        </button>
                    
                    </div>
                </div>

                <!-- Hero Illustration -->
                <div class="fade-in">
                    <div class="bg-white rounded-2xl shadow-lg p-8">
                        <svg viewBox="0 0 400 300" class="w-full">
                            <!-- Background -->
                            <rect width="400" height="300" fill="#f8fafc" rx="20"/>
                            
                            <!-- Multiple Screens representing different packages -->
                            <rect x="60" y="60" width="80" height="60" rx="6" fill="#1e293b"/>
                            <rect x="63" y="63" width="74" height="40" rx="3" fill="#2563eb"/>
                            <text x="100" y="130" text-anchor="middle" fill="#6b7280" font-size="10">Basic</text>
                            
                            <rect x="160" y="50" width="80" height="60" rx="6" fill="#1e293b"/>
                            <rect x="163" y="53" width="74" height="40" rx="3" fill="#10b981"/>
                            <text x="200" y="120" text-anchor="middle" fill="#6b7280" font-size="10">Premium</text>
                            
                            <rect x="260" y="60" width="80" height="60" rx="6" fill="#1e293b"/>
                            <rect x="263" y="63" width="74" height="40" rx="3" fill="#f59e0b"/>
                            <text x="300" y="130" text-anchor="middle" fill="#6b7280" font-size="10">Ultimate</text>
                            
                            <!-- Central Figure -->
                            <circle cx="200" cy="180" r="25" fill="#e2e8f0"/>
                            <rect x="180" y="205" width="40" height="50" rx="8" fill="#2563eb"/>
                            
                            <!-- Success Elements -->
                            <circle cx="320" cy="200" r="15" fill="#10b981" opacity="0.2"/>
                            <path d="M313 200 L318 205 L327 193" stroke="#10b981" stroke-width="2" fill="none"/>
                            
                            <circle cx="80" cy="200" r="12" fill="#f59e0b" opacity="0.2"/>
                            <polygon points="80,192 83,198 90,198 85,202 87,209 80,205 73,209 75,202 70,198 77,198" fill="#f59e0b"/>
                            
                            <!-- Bottom Text -->
                            <text x="200" y="280" text-anchor="middle" fill="#6b7280" font-size="12" font-weight="500">
                                Pilihan Try Out Terlengkap
                            </text>
                        </svg>
                    </div>
                </div>
            </div>
        </div>
    </section>
</template>