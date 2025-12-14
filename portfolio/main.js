// -- Script for mobile side menu toggle --
const sideMenu = document.getElementById('sideMenu');
const openMenu = document.getElementById('openMenu');
const closeMenu = document.getElementById('closeMenu');

openMenu.addEventListener('click', () => {
    sideMenu.classList.remove('translate-y-full');
    openMenu.classList.add('translate-y-full');
});

closeMenu.addEventListener('click', () => {
    sideMenu.classList.add('translate-y-full');
    openMenu.classList.remove('translate-y-full');
});

// -- Script for Intro Text Translation --

const introText = document.getElementById("intro-text");
var enIntroText = introText.innerHTML;
var faIntroText = `
<h2 class="text-3xl font-bold text-gray-800 mb-4 lg:mt-12">سلام، من محمدرضا هستم 👋</h2>
<p class="text-gray-700 leading-relaxed mb-4">
    مهندس یادگیری عمیق و توسعه‌دهندهٔ بک‌اند؛ تجربهٔ کار پژوهشی و صنعتی. عمدتاً با PyTorch کار می‌کنم؛ داده‌ها را پاک‌سازی و آماده می‌کنم، مدل‌ها را طراحی و بازتولید می‌کنم؛ تحقیقات را به راه‌حل‌های عملی تبدیل می‌کنم. علاقه‌مند به همکاری با تیم‌های خلاق برای ساختن سیستم‌هایی هوشمندم.
</p>
<p class="text-gray-700 leading-relaxed mb-4">
    سبک کدنویسی‌ام تا حدی نامتعارف و بازیگوش است... تک‌خطی‌ها، ASCII آرت‌های بامزه و کامنت‌هایی که گه‌گاه شبیه یادداشت‌های روزانه‌اند. از به چالش کشیدن الگوریتم‌ها و دیدن مدل‌ها هنگام بیدار شدن و یادگیری لذت می‌برم.
</p>
<button onclick="translateIntroTextEn()"
    class="inline-flex items-center px-6 py-2 rounded-xl
            border border-[#42110a]/30 text-[#42110a]
            text-sm tracking-wide
            transition-all duration-300
            hover:bg-[#42110a] hover:text-[#f0f0f3] hover:border-[#42110a]">
    <svg xmlns="http://www.w3.org/2000/svg" class="w-6 h-6" viewBox="0 0 24 24" fill="none">
        <path d="M5 8L10 13M4 14L10 8L12 5M2 5H14M7 2H8M12.913 17H20.087M12.913 17L11 21M12.913 17L15.7783 11.009C16.0092 10.5263 16.1246 10.2849 16.2826 10.2086C16.4199 10.1423 16.5801 10.1423 16.7174 10.2086C16.8754 10.2849 16.9908 10.5263 17.2217 11.009L20.087 17M20.087 17L22 21" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
    </svg>
</button>
`

function translateIntroTextFa() {
    introText.innerHTML = faIntroText;
    introText.dir = "rtl";
}

function translateIntroTextEn() {
    introText.innerHTML = enIntroText;
    introText.dir = "ltr";
}