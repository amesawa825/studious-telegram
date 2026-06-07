// server.js
import { serveDir } from "jsr:@std/http/file-server";

// 直前の単語を保持しておく
let wordHistories = ["しりとり"];
let previousWord = "しりとり";

// localhostにDenoのHTTPサーバーを展開
Deno.serve(async (_req) => {
    // パス名を取得する
    const pathname = new URL(_req.url).pathname;
    console.log(`pathname: ${pathname}`);

    // GET /shiritori: 直前の単語を返す
    if (_req.method === "GET" && pathname === "/shiritori") {
        return new Response(previousWord);
    }

    if (_req.method === "GET" && pathname === "/history") {
        return new Response(JSON.stringify(wordHistories), {
            headers: { "Content-Type": "application/json; charset=utf-8" },
        });
    }

    // POST /shiritori: 次の単語を受け取って保存する
    if (_req.method === "POST" && pathname === "/shiritori") {
        // リクエストのペイロードを取得
        const requestJson = await _req.json();
        // JSONの中からnextWordを取得
        const nextWord = requestJson["nextWord"];

        const hiraganaRegex = /^[ぁ-ん]+$/;

        if (!hiraganaRegex.test(nextWord)) {
            return new Response(
                JSON.stringify({
                    "errorMessage": "ひらがなだけで入力してください",
                    "errorCode": "10002", // 新しいエラーコード
                }),
                {
                    status: 400,
                    headers: {
                        "Content-Type": "application/json; charset=utf-8",
                    },
                },
            );
        }

        //  エラーチェック1：すでに使われた単語の場合
        if (wordHistories.includes(nextWord)) {
            return new Response(
                JSON.stringify({
                    "errorMessage": `「${nextWord}」はすでに使われた単語です`,
                    "errorCode": "10011",
                }),
                {
                    status: 400,
                    headers: {
                        "Content-Type": "application/json; charset=utf-8",
                    },
                },
            );
        }

        //  エラーチェック2：末尾が「ん」になっている場合
        if (nextWord.slice(-1) === "ん") {
            return new Response(
                JSON.stringify({
                    "errorMessage":
                        "末尾が「ん」で終わったので、ゲームを終了します",
                    "errorCode": "10011",
                }),
                {
                    status: 400,
                    headers: {
                        "Content-Type": "application/json; charset=utf-8",
                    },
                },
            );
        }

        //  エラーチェック3：前の単語に続いていない場合
        if (previousWord.slice(-1) !== nextWord.slice(0, 1)) {
            return new Response(
                JSON.stringify({
                    "errorMessage": "前の単語に続いていません",
                    "errorCode": "10001",
                }),
                {
                    status: 400,
                    headers: {
                        "Content-Type": "application/json; charset=utf-8",
                    },
                },
            );
        }

        //  すべてのエラーをクリアしたら「正解」の処理
        previousWord = nextWord;
        wordHistories.push(nextWord);

        // 新しい単語をフロントエンドに返す
        return new Response(previousWord);
    } // ここでPOSTのif文が閉じる

    if (_req.method === "POST" && pathname === "/reset") {
        // 既存の単語の履歴を初期化する
        wordHistories = ["しりとり"];
        previousWord = "しりとり";

        // 初期化した単語を返す
        return new Response(previousWord);
    }

    // ./public以下のファイルを公開
    return serveDir(
        _req,
        {
            fsRoot: "./public/",
            urlRoot: "",
            enableCors: true,
        },
    );
}); // ここでDeno.serveが閉じる
