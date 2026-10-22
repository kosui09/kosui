
const SUPABASE_URL = "https://dkoujxtnbntypqvvkgdp.supabase.co";
const SUPABASE_KEY = "sb_publishable_tphjIS3FRrcPgIb_hJj56g_a02OIEZ3";

const status = document.getElementById("status");
const reviewList = document.getElementById("review-list");
const form = document.getElementById("review-form");
const formStatus = document.getElementById("form-status");
const submitButton = document.getElementById("submit-button");

let db = null;

function showSetupError(message) {
  status.textContent = message;
}

if (
  !window.supabase ||
  SUPABASE_URL.includes("ここに") ||
  SUPABASE_KEY.includes("ここに")
) {
  showSetupError(
    "サイトの接続設定がまだ完了していません。管理者が設定を確認してください。"
  );
  form.hidden = true;
} else {
  db = window.supabase.createClient(
    SUPABASE_URL,
    SUPABASE_KEY
  );
  loadReviews();
}

function formatDate(value) {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "";
  }

  return new Intl.DateTimeFormat("ja-JP", {
    year: "numeric",
    month: "long",
    day: "numeric"
  }).format(date);
}

function makeReviewCard(review) {
  const card = document.createElement("article");
  card.className = "review-card";

  const meta = document.createElement("div");
  meta.className = "review-meta";

  const name = document.createElement("span");
  name.textContent = review.nickname || "匿名";

  const date = document.createElement("time");
  date.dateTime = review.created_at;
  date.textContent = formatDate(review.created_at);

  const body = document.createElement("p");
  body.className = "review-body";

  // textContentを使い、投稿文をHTMLとして実行させない
  body.textContent = review.body;

  meta.append(name, date);
  card.append(meta, body);

  return card;
}

async function loadReviews() {
  if (!db) return;

  status.textContent = "感想を読み込んでいます……";
  reviewList.replaceChildren();

  const { data, error } = await db
    .from("reviews")
    .select("id, nickname, body, created_at")
    .order("created_at", { ascending: false })
    .limit(100);

  if (error) {
    console.error(error);
    status.textContent =
      "感想を読み込めませんでした。時間をおいて再度お試しください。";
    return;
  }

  if (!data || data.length === 0) {
    status.textContent =
      "まだ感想はありません。最初の感想を残してみませんか？";
    return;
  }

  const cards = data.map(makeReviewCard);
  reviewList.replaceChildren(...cards);
  status.textContent = `新しい感想から${data.length}件を表示しています。`;
}

form.addEventListener("submit", async (event) => {
  event.preventDefault();

  if (!db || submitButton.disabled) return;

  const nicknameInput = document.getElementById("nickname");
  const bodyInput = document.getElementById("body");
  const agreement = document.getElementById("agreement");

  const nickname = nicknameInput.value.trim() || "匿名";
  const body = bodyInput.value.trim();

  if (!agreement.checked) {
    formStatus.textContent =
      "感想が公開されることを確認してください。";
    return;
  }

  if (nickname.length > 30) {
    formStatus.textContent = "お名前は30文字以内にしてください。";
    return;
  }

  if (body.length < 1 || body.length > 2000) {
    formStatus.textContent =
      "感想は1〜2000文字で入力してください。";
    return;
  }

  submitButton.disabled = true;
  submitButton.textContent = "投稿しています……";
  formStatus.textContent = "";

  try {
    const { error } = await db
      .from("reviews")
      .insert([{ nickname, body }]);

    if (error) {
      console.error(error);
      formStatus.textContent =
        "投稿できませんでした。時間をおいて再度お試しください。";
      return;
    }

    form.reset();
    formStatus.textContent = "感想を投稿しました。ありがとうございます。";

    await loadReviews();

    document.getElementById("reviews").scrollIntoView({
      behavior: "smooth",
      block: "start"
    });
  } catch (error) {
    console.error(error);
    formStatus.textContent =
      "通信に失敗しました。ネットワークを確認してください。";
  } finally {
    submitButton.disabled = false;
    submitButton.textContent = "感想を投稿する";
  }
});
