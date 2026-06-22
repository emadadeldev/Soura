let isPlaying = false;
let selectedReciter = 51;

// saved playback state
let currentIndex = 0;
let currentTime = 0;

// Load saved state from localStorage
function loadSavedState() {
  const saved = localStorage.getItem("audioState");

  if (!saved) return;

  const state = JSON.parse(saved);

  selectedReciter = state.reciter || 51;
  currentIndex = state.index || 0;
  currentTime = state.time || 0;
}

// Load reciters list
async function loadReciters() {
  try {
    const res = await fetch(
      "https://www.mp3quran.net/api/v3/reciters?language=ar"
    );

    const data = await res.json();

    const select = document.getElementById("reciterSelect");

    select.innerHTML = "";

    data.reciters.forEach(reciter => {
      if (!reciter.moshaf || !reciter.moshaf.length) return;

      const option = document.createElement("option");
      option.value = reciter.id;
      option.textContent = reciter.name;

      if (reciter.id == selectedReciter) {
        option.selected = true;
      }

      select.appendChild(option);
    });

    select.addEventListener("change", () => {
      selectedReciter = select.value;

      // reset progress when changing reciter
      currentIndex = 0;
      currentTime = 0;

      localStorage.removeItem("audioState");

      loadSoura();
    });

  } catch (err) {
    console.error(err);
  }
}

// Load surahs for selected reciter
async function loadSoura() {
  const url =
    `https://www.mp3quran.net/api/v3/reciters?language=ar&reciter=${selectedReciter}`;

  try {
    const res = await fetch(url);
    const json = await res.json();

    const r = json.reciters[0];

    if (!r || !r.moshaf || !r.moshaf.length) {
      throw new Error("No moshaf found");
    }

    const server = r.moshaf[0].server;

    const surahList = r.moshaf[0].surah_list
      .split(",")
      .map(n => n.padStart(3, "0"));

    const surahNames = [
      "الفاتحة","البقرة","آل عمران","النساء","المائدة","الأنعام","الأعراف","الأنفال","التوبة","يونس",
      "هود","يوسف","الرعد","إبراهيم","الحجر","النحل","الإسراء","الكهف","مريم","طه",
      "الأنبياء","الحج","المؤمنون","النور","الفرقان","الشعراء","النمل","القصص","العنكبوت","الروم",
      "لقمان","السجدة","الأحزاب","سبأ","فاطر","يس","الصافات","ص","الزمر","غافر",
      "فصلت","الشورى","الزخرف","الدخان","الجاثية","الأحقاف","محمد","الفتح","الحجرات","ق",
      "الذاريات","الطور","النجم","القمر","الرحمن","الواقعة","الحديد","المجادلة","الحشر","الممتحنة",
      "الصف","الجمعة","المنافقون","التغابن","الطلاق","التحريم","الملك","القلم","الحاقة","المعارج",
      "نوح","الجن","المزمل","المدثر","القيامة","الإنسان","المرسلات","النبأ","النازعات","عبس",
      "التكوير","الانفطار","المطففين","الانشقاق","البروج","الطارق","الأعلى","الغاشية","الفجر","البلد",
      "الشمس","الليل","الضحى","الشرح","التين","العلق","القدر","البينة","الزلزلة","العاديات",
      "القارعة","التكاثر","العصر","الهمزة","الفيل","قريش","الماعون","الكوثر","الكافرون","النصر",
      "المسد","الإخلاص","الفلق","الناس"
    ];

    const all = surahList.map(num => ({
      name: surahNames[parseInt(num) - 1] || `سورة ${num}`,
      url: server + num + ".mp3"
    }));

    playSoura(all);

  } catch (error) {
    document.getElementById("souraTitle").textContent =
      "فشل في تحميل السور.";

    console.error(error);
  }
}

// Play daily surahs with resume support
function playSoura(data) {
  const today = new Date();
  const day = today.getDate();

  let idx = (day - 1) * 3 + currentIndex;

  const player = document.getElementById("audioPlayer");
  const title = document.getElementById("souraTitle");

  let cur = 0;

  const dailySouras = data.slice(idx, idx + 3);

  title.textContent =
    "سُوَر اليوم: " +
    dailySouras.map(s => s.name).join(" • ");

  const next = () => {
    const s = dailySouras[cur % dailySouras.length];

    player.src = s.url;

    player.onloadedmetadata = () => {
      if (cur === 0 && currentTime > 0) {
        player.currentTime = currentTime;
      }
    };

    player.play();

    player.ontimeupdate = () => {
      localStorage.setItem("audioState", JSON.stringify({
        reciter: selectedReciter,
        index: cur,
        time: player.currentTime
      }));
    };

    player.onended = () => {
      cur++;
      currentIndex = cur;
      currentTime = 0;

      localStorage.removeItem("audioState");
      next();
    };
  };

  next();
}

// Play / Pause toggle
function togglePlayPause() {
  const player = document.getElementById("audioPlayer");
  const icon = document.querySelector("#playPauseButton i");

  if (isPlaying) {
    player.pause();
    icon.classList.replace("fa-pause", "fa-play");
  } else {
    player.play();
    icon.classList.replace("fa-play", "fa-pause");
  }

  isPlaying = !isPlaying;
}

// init app
loadSavedState();
loadReciters().then(loadSoura);