// MergeAndPlay.js for Scriptable
//
// 概要:
// このスクリプトはiOSのショートカットアプリから呼び出されることを想定しています。
// ショートカットから渡された引数（JSON形式の文字列）を元に、
// 複数のMusicXMLファイルを一つに結合し、そのファイルパスをショートカットに返します。

// --- メイン処理 ---
(async () => {
  try {
    // 1. ショートカットから渡された引数（パラメータ）を受け取る
    const params = getParamsFromShortcut(args.plainTexts[0]);

    // 2. 全てのURLからMusicXMLデータを非同期で読み込む
    const xmlStrings = await fetchAllXML(params.urls);

    // 3. MusicXMLデータをマージ（結合）する
    const mergedXml = mergeMeasures(xmlStrings);

    // 4. マージしたMusicXMLをファイルとして保存する
    const outputPath = await saveToFile(params.output, mergedXml);

    // 5. ショートカットに結果（ファイルパス）を返却する
    if (config.runsInApp) {
      // Scriptableアプリ内で直接このスクリプトを実行した場合、
      // 動作確認のためにプレビューを表示します。
      QuickLook.present(outputPath, true);
    } else {
      // ショートカットから実行された場合、最終的なファイルパスを出力として設定します。
      // これにより、ショートカット側でファイルを受け取ることができます。
      Script.setShortcutOutput(outputPath);
    }

  } catch (e) {
    // エラーが発生した場合は、ユーザーに分かりやすい形でアラートを表示します。
    console.error(e);
    let alert = new Alert();
    alert.title = "エラーが発生しました";
    alert.message = e.message;
    alert.addAction("OK");
    await alert.present();
  }
})();


// --- 各種機能の定義 ---

/**
 * ショートカットからの入力をパース（解析）して、使いやすいオブジェクト形式に変換します。
 * @param {string} inputJSON - ショートカットから渡されるJSON文字列。
 * 例: '{"urls": ["http://...", "http://..."], "output": "combined.musicxml"}'
 * @returns {{urls: string[], output: string}} パースされたオブジェクト。
 * @throws {Error} 入力が不正な場合にエラーを投げます。
 */
function getParamsFromShortcut(inputJSON) {
  if (!inputJSON) {
    throw new Error("ショートカットからパラメータが渡されませんでした。ショートカットの設定を確認してください。");
  }
  try {
    const params = JSON.parse(inputJSON);
    if (!params.urls || !Array.isArray(params.urls) || params.urls.length === 0) {
      throw new Error("URLのリストが見つかりません。QRコードを1枚以上スキャンしてください。");
    }
    if (!params.output) {
        // デフォルトの出力ファイル名を設定
        params.output = "combined.musicxml";
    }
    return params;
  } catch (e) {
    throw new Error("ショートカットからの入力データ（JSON）が正しくありません。");
  }
}

/**
 * URLの配列を受け取り、すべてのURLからテキストデータを非同期で取得します。
 * Promise.allを使うことで、複数の通信を並行して行い、処理を高速化します。
 * @param {string[]} urls - MusicXMLファイルのURLの配列。
 * @returns {Promise<string[]>} 取得したXML文字列の配列。
 */
async function fetchAllXML(urls) {
  // 各URLに対してリクエストを作成
  const promises = urls.map(url => new Request(url).loadString());
  // すべてのリクエストが完了するのを待つ
  const xmls = await Promise.all(promises);
  return xmls;
}

/**
 * 複数のMusicXML文字列を受け取り、2つ目以降のファイルの<measure>要素を最初のファイルに結合します。
 * @param {string[]} xmlArray - MusicXML文字列の配列。
 * @returns {string} 結合された単一のMusicXML文字列。
 * @throws {Error} 入力データが不正な場合にエラーを投げます。
 */
function mergeMeasures(xmlArray) {
  if (xmlArray.length === 0) {
    throw new Error("結合するXMLデータが見つかりません。");
  }

  const parser = new DOMParser();

  // 1. ベースとなる最初のXMLドキュメントを準備
  const baseDoc = parser.parseFromString(xmlArray[0], "application/xml");
  const basePart = baseDoc.getElementsByTagName("part")[0];

  // part要素が見つからない場合はエラー（ファイルがMusicXMLでない可能性）
  if (!basePart) {
    throw new Error("最初のMusicXMLファイルに<part>要素が見つかりませんでした。ファイル形式が正しいか確認してください。");
  }

  // 2. 2つ目以降のXMLドキュメントから<measure>要素を抜き出し、ベースに追加
  for (let i = 1; i < xmlArray.length; i++) {
    const doc = parser.parseFromString(xmlArray[i], "application/xml");
    const measures = doc.getElementsByTagName("measure");
    for (const measure of measures) {
      // importNodeで、外部ドキュメントの要素を現在のドキュメントで使えるように変換する
      const importedMeasure = baseDoc.importNode(measure, true);
      basePart.appendChild(importedMeasure);
    }
  }

  // 3. 結合したドキュメントを文字列として出力
  //    XML宣言（<?xml ...?>）を付けて出力する
  return '<?xml version="1.0" encoding="UTF-8" standalone="no"?>\n' + new XMLSerializer().serializeToString(baseDoc);
}

/**
 * 文字列データをファイルとして端末のローカルストレージ（Scriptableのフォルダ）に保存します。
 * @param {string} fileName - 保存するファイル名。
 * @param {string} content - 保存するファイルの中身。
 * @returns {Promise<string>} 保存されたファイルのフルパス。
 * @throws {Error} ファイルの保存に失敗した場合にエラーを投げます。
 */
async function saveToFile(fileName, content) {
  const fm = FileManager.local();
  const docsDir = fm.documentsDirectory();
  const path = fm.joinPath(docsDir, fileName);
  
  // 既存のファイルがあれば上書きする
  fm.writeString(path, content);
  
  // ファイルが正常に書き込めたか確認
  if (fm.fileExists(path)) {
    console.log(`ファイルが正常に保存されました: ${path}`);
    return path;
  } else {
    throw new Error("ファイルの保存に失敗しました。");
  }
}
