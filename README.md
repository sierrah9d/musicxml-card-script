# ショートカット解説: QRコード複数スキャン ✨

このショートカットは、複数のQRコードやバーコードを連続でスキャンし、スキャンした内容（MusicXMLのURL）をScriptableで動作するJavaScript `XMLMerge.js` で合成処理を行うものです。

初めてショートカットを作成する方でも分かりやすいように、各ステップを丁寧に解説します。

-----

## 💡 このショートカットでできること

  * 入力された回数分だけ、QRコードやバーコードを連続でスキャンできます。
  * スキャンしたQRコードの内容（URLなど）を一覧で確認できます。
  * スキャンしたURLリストを別のショートカット（`XMLMerge`）に渡して処理を継続できます。

-----

## 🛠️ ショートカットの再現方法

iPhone/iPadの「ショートカット」アプリを開き、以下の手順でショートカットを作成していきましょう。

### 1\. 新しいショートカットの作成

1.  ショートカットアプリを開きます。
2.  画面右上にある「+」ボタンをタップします。
3.  「新規ショートカット」が作成されます。

### 2\. 各アクションの追加と設定

ここから、上から順にアクションを追加していきます。

#### ① 「入力から数字を取得」

  * **何をするアクション？**: ショートカットが開始される際に、外部から受け取った情報（共有シートからの入力など）の中から数字だけを抽出します。
  * **追加方法**:
    1.  画面下部の検索バーで「数字を取得」と検索します。
    2.  「入力から数字を取得」をタップして追加します。

#### ② 「変数 CardCount を 数字 に設定」

  * **何をするアクション？**: ①で取得した数字を「CardCount」という名前の変数に保存します。この変数を使って、後で何回QRコードをスキャンするかを制御します。
  * **追加方法**:
    1.  検索バーで「変数を設定」と検索します。
    2.  「変数を設定」をタップして追加します。
    3.  「変数」の部分をタップして、「新規変数」を選択し、名前を「`CardCount`」と入力します。
    4.  「に設定」の右側の青い「`変数`」をタップし、表示されるマジック変数から「入力から取得した数字」を選択します。

#### ③ 「CardCount 繰り返す」

  * **何をするアクション？**: 「CardCount」に設定された回数だけ、この中のアクションを繰り返します。
  * **追加方法**:
    1.  検索バーで「繰り返す」と検索します。
    2.  「繰り返す」をタップして追加します。
    3.  追加された「繰り返す」アクションの「`数値`」の部分をタップし、マジック変数から「変数 CardCount」を選択します。

#### ④ 「アラート QRコード を撮影します を表示」

  * **何をするアクション？**: QRコードのスキャンを開始する前に、「QRコードを撮影します」というメッセージを画面に表示し、ユーザーに準備を促します。
  * **追加方法**:
    1.  検索バーで「アラート」と検索します。
    2.  「アラートを表示」をタップして追加します。
    3.  「こんにちは」の部分をタップして、「`QRコードを撮影します`」と入力します。
    4.  右端の矢印をタップしてオプションを表示し、「ボタンを表示」のチェックを外します（OKボタンを押さずにすぐに次のアクションへ進むため）。

#### ⑤ 「QR またはバーコードをスキャン」

  * **何をするアクション？**: カメラを起動し、QRコードやバーコードをスキャンします。スキャンした内容は次のアクションに渡されます。
  * **追加方法**:
    1.  検索バーで「QR」と検索します。
    2.  「QRまたはバーコードをスキャン」をタップして追加します。
    <!-- end list -->
      * **重要**: このアクションは③の「繰り返し」の中にドラッグ＆ドロップして配置してください。

#### ⑥ 「If 繰り返しインデックス が次と等しい 1 の場合」

  * **何をするアクション？**: 繰り返し処理の「最初の1回目」かどうかを判断します。最初の1回目だけ特定の処理を行い、2回目以降は別の処理を行うために使います。
  * **追加方法**:
    1.  検索バーで「If」と検索します。
    2.  「If文」をタップして追加します。
    3.  「If」の右側の「`条件`」をタップし、表示される選択肢から「マジック変数」の「`繰り返しインデックス`」を選択します。
    4.  「`が次と等しい`」はそのままで、「`テキスト`」の部分をタップして「`1`」と入力します。
    <!-- end list -->
      * **重要**: このアクションも③の「繰り返し」の中にドラッグ＆ドロップして配置してください。⑤の「QRまたはバーコードをスキャン」の下に来るようにします。

#### ⑦ 「変数 URLList を QR/バーコード に設定」

  * **何をするアクション？**: 初めてのQRコードをスキャンした場合に、スキャン結果を「URLList」という新しい変数に保存します。これが後でスキャンしたURLのリストの最初の要素になります。
  * **追加方法**:
    1.  検索バーで「変数を設定」と検索します。
    2.  「変数を設定」をタップして追加します。
    3.  「変数」の部分をタップして、「新規変数」を選択し、名前を「`URLList`」と入力します。
    4.  「に設定」の右側の青い「`変数`」をタップし、表示されるマジック変数から「QR/バーコード（⑤でスキャンした内容）」を選択します。
    <!-- end list -->
      * **重要**: このアクションは⑥の「If」の中（「If文」と「その他の場合」の間）にドラッグ＆ドロップして配置してください。

#### ⑧ 「その他の場合」

  * **何をするアクション？**: 繰り返し処理が2回目以降の場合に実行される部分です。
  * **追加方法**: これは⑥の「If」アクションを配置すると自動的に追加されます。特に操作は不要です。

#### ⑨ 「QR/バーコード を URLList に追加」

  * **何をするアクション？**: 2回目以降のQRコードスキャン結果を、既存の「URLList」変数に追加していきます。これにより、複数のQRコードの内容が1つのリストにまとめられます。
  * **追加方法**:
    1.  検索バーで「リストに追加」と検索します。
    2.  「リストに追加」をタップして追加します。
    3.  「項目」の部分をタップし、マジック変数から「QR/バーコード（⑤でスキャンした内容）」を選択します。
    4.  「`に`」の右側の青い「`変数`」をタップし、マジック変数から「変数 URLList」を選択します。
    <!-- end list -->
      * **重要**: このアクションは⑧の「その他の場合」の中（「その他の場合」と「If文の終了」の間）にドラッグ＆ドロップして配置してください。

#### ⑩ 「If文の終了」

  * **何をするアクション？**: ⑥の「If」条件分岐の終わりを示します。
  * **追加方法**: ⑥の「If」アクションを配置すると自動的に追加されます。

#### ⑪ 「繰り返しの終了」

  * **何をするアクション？**: ③の「繰り返し」処理の終わりを示します。
  * **追加方法**: ③の「繰り返し」アクションを配置すると自動的に追加されます。

#### ⑫ 「変数 URLs を URLList に設定」

  * **何をするアクション？**: 繰り返し処理が終わった後、最終的に作成されたURLのリスト（URLList）を「URLs」という別の変数にコピーします。これは次のアクションに渡すための準備です。
  * **追加方法**:
    1.  検索バーで「変数を設定」と検索します。
    2.  「変数を設定」をタップして追加します。
    3.  「変数」の部分をタップして、「新規変数」を選択し、名前を「`URLs`」と入力します。
    4.  「に設定」の右側の青い「`変数`」をタップし、表示されるマジック変数から「変数 URLList」を選択します。
    <!-- end list -->
      * **重要**: このアクションは⑪の「繰り返しの終了」の\*\*外側（下）\*\*に配置してください。

#### ⑬「ショートカットを実行 XMLMerge」

  * **何をするアクション？**: スキャンしたURLのリスト（URLs）を引数として、別のショートカット「XMLMerge」を実行します。
  * **追加方法**:
    1.  検索バーで「ショートカットを実行」と検索します。
    2.  「ショートカットを実行」をタップして追加します。
    3.  「`ショートカット`」の部分をタップし、ショートカットの一覧から\*\*`XMLMerge`\*\*を選択します。（このショートカットが存在しない場合は、エラーになります。事前にScriptableにXMLMerge.jsをセットアップしておく必要があります。）
    4.  「`入力を渡す`」が「オン」になっていることを確認し、「`入力`」の部分をタップして、マジック変数から「変数 URLs」を選択します。

### 3\. ショートカットの名前を設定

1.  画面上部の「新規ショートカット」と書かれている部分をタップします。
2.  「名称変更」を選択し、ショートカットの分かりやすい名前（例: `複数QRスキャン` など）を入力して「完了」をタップします。
3.  画面右上の「完了」ボタンをタップしてショートカットの作成を終了します。

-----

## ▶️ ショートカットの実行方法

1.  ショートカットアプリで作成したショートカットをタップして実行します。
2.  「QRコードを撮影します」というアラートが表示された後、カメラが起動します。
3.  スキャンしたいQRコードやバーコードをカメラで読み取ります。
4.  「CardCount」で指定した回数分、このスキャンとアラート表示が繰り返されます。
5.  その後、「XMLMerge」ショートカットが実行され、結合されたMusicXMLファイルがiCloudに保存され、SeeScore2アプリで開くか、手動で共有するオプションが表示されます。

-----

## 🎶 MusicXMLカードでメロディーを作ろう！

QRコードのカードを並べて、自分だけの音楽を奏でる方法を、インタラクティブなガイドでご紹介します。

### どういう仕組み？

1.  **🃏 カードを並べる**: 好きな順番にMusicXMLのQRコードが印刷されたカードを並べます。
2.  **📱 iPhoneでスキャン**: 作成したショートカットを使って、並べたカードのQRコードを順番にスキャンします。
3.  **🪄 魔法のコードが実行**: スキャンされた複数のMusicXMLデータは、Scriptableスクリプト `XMLMerge.js` によって1つのMusicXMLファイルに結合されます。
4.  **🎼 楽譜が完成！**: 結合されたMusicXMLファイルが生成され、SeeScore2などの楽譜アプリで開いて演奏できます。

-----

## 📋 準備するもの

  * **iPhone**
  * **Scriptableアプリ**（無料） [https://apps.apple.com/jp/app/scriptable/id1405459188](https://apps.apple.com/jp/app/scriptable/id1405459188)
  * **GitHubアカウント**（無料） [https://github.com/](https://github.com/) - MusicXMLファイルをオンラインでホストするために使用します。
  * **MusicXMLファイル (各カード用)** - 1つ1つの短い楽譜データです。
  * **印刷用の紙とプリンター** - QRコードカードを印刷するため。

-----

## ⚙️ セットアップガイド

### ステップ1: 楽譜(MusicXML)の準備とQRコード化

最初に、カード1枚1枚に対応する短いMusicXMLファイルを用意し、インターネット上でアクセスできるようにします。これにはGitHub Gistが便利です。

1.  **GitHub Gistにアクセス**: [gist.github.com](https://gist.github.com/) を開き、ログインします。
2.  **MusicXMLを貼り付け**: 分割したMusicXMLファイルの中身をGistのテキストエリアに貼り付け、`card1.musicxml` のようなファイル名を付けます。
3.  **Gistを作成**: "Create secret gist" をクリックして保存します。
4.  **"Raw" URLをコピー**: 作成されたGistページで、ファイルの右上にある **[ Raw ]** ボタンをクリックします。表示されたページのURLが、QRコードにするためのURLです。これをコピーしてください。
5.  **QRコードを作成**: [QRのススメ](https://qr.quel.jp/try.php)などのサイトで、コピーしたURLからQRコードを生成し、印刷してカードにします。

-----

### ステップ2: 魔法のコード(Scriptable)を設定

次に、iPhoneのScriptableアプリに、QRコードから読み取った複数のMusicXMLファイルを1つに結合するための「魔法のコード（スクリプト）」を設定します。

1.  Scriptableアプリを開き、右上の「+」をタップして新しいスクリプトを作成します。
2.  スクリプト名を「XMLMerge」に設定します。
3.  以下のコードブロックの内容をScriptableに貼り付けます。
4.  右上の「Done」をタップして保存すれば完了です。

<!-- end list -->

```javascript
// ショートカットアプリからURLを受け取ってMusicXMLを合成し、SeeScore2に共有するScriptableスクリプト
// iCloud Driveに保存して共有

// ショートカットからの入力を受け取る
let urls = args.shortcutParameter;

// URLが配列でない場合は配列に変換
if (!Array.isArray(urls)) {
  urls = urls ? [urls] : [];
}

// URLが存在しない場合の処理
if (!urls || urls.length === 0) {
  let alert = new Alert();
  alert.title = "エラー";
  alert.message = "URLが渡されませんでした";
  alert.addAction("OK");
  await alert.present();
  return;
}

// 最大10個までに制限
urls = urls.slice(0, 10);
console.log(`${urls.length}個のURLからMusicXMLをダウンロードします`);

// MusicXMLをダウンロードする関数
async function downloadMusicXML(url) {
  try {
    let request = new Request(url);
    let response = await request.loadString();
    console.log(`ダウンロード完了: ${url}`);
    return response;
  } catch (error) {
    console.error(`ダウンロードエラー ${url}: ${error}`);
    return null;
  }
}

// MusicXMLを順番に繋げる関数（省略せず完全実装）
function combineMusicXML(xmlStrings) {
  if (xmlStrings.length === 0) return null;
  if (xmlStrings.length === 1) return xmlStrings[0];

  let allMeasures = [];
  let currentMeasureNumber = 1;
  let globalAttributes = null;

  for (let i = 0; i < xmlStrings.length; i++) {
    let xmlContent = xmlStrings[i];
    let partMatch = xmlContent.match(/<part[^>]*>([\s\S]*?)<\/part>/);
    if (!partMatch) {
      console.log(`Part ${i + 1}: partタグが見つかりません。スキップします。`);
      continue;
    }
    let partContent = partMatch[1];
    if (i === 0) {
      let attributesMatch = partContent.match(/<attributes[^>]*>([\s\S]*?)<\/attributes>/);
      if (attributesMatch) {
        globalAttributes = attributesMatch[1];
      }
    }
    let measureMatches = partContent.match(/<measure[^>]*>[\s\S]*?<\/measure>/g);
    if (measureMatches) {
      for (let measure of measureMatches) {
        let updatedMeasure = measure.replace(/number="[^"]*"/, `number="${currentMeasureNumber}"`);
        if (i > 0) {
          updatedMeasure = updatedMeasure.replace(/<attributes[^>]*>[\s\S]*?<\/attributes>/g, '');
        }
        allMeasures.push(updatedMeasure);
        currentMeasureNumber++;
      }
    }
  }

  if (allMeasures.length === 0) {
    console.log("有効なメジャーが見つかりませんでした");
    return null;
  }

  let combinedXML = `<?xml version="1.0" encoding="UTF-8" standalone="no"?>
<!DOCTYPE score-partwise PUBLIC
    "-//Recordare//DTD MusicXML 3.1 Partwise//EN"
    "http://www.musicxml.org/dtds/partwise.dtd">
<score-partwise version="3.1">
  <work>
    <work-title>Sequential Combined MusicXML</work-title>
  </work>
  <identification>
    <creator type="composer">Scriptable Sequential</creator>
    <encoding>
      <software>Scriptable</software>
      <encoding-date>${new Date().toISOString().split('T')[0]}</encoding-date>
    </encoding>
  </identification>
  <part-list>
    <score-part id="P1">
      <part-name>Combined Sequence</part-name>
      <score-instrument id="P1-I1">
        <instrument-name>Piano</instrument-name>
      </score-instrument>
      <midi-device id="P1-I1" port="1"></midi-device>
      <midi-instrument id="P1-I1">
        <midi-channel>1</midi-channel>
        <midi-program>1</midi-program>
        <volume>78.7402</volume>
        <pan>0</pan>
      </midi-instrument>
    </score-part>
  </part-list>
  <part id="P1">`;

  if (allMeasures.length > 0 && globalAttributes) {
    let firstMeasure = allMeasures[0];
    if (!firstMeasure.includes('<attributes')) {
      firstMeasure = firstMeasure.replace(
        /<measure[^>]*>/,
        `<measure number="1">
      <attributes>${globalAttributes}</attributes>`
      );
      allMeasures[0] = firstMeasure;
    }
  }

  for (let measure of allMeasures) {
    combinedXML += `
    ${measure}`;
  }

  combinedXML += `
  </part>
</score-partwise>`;

  return combinedXML;
}

// 実行開始
console.log("ダウンロード開始...");
try {
  let downloadPromises = urls.map(url => downloadMusicXML(url));
  let xmlStrings = await Promise.all(downloadPromises);
  xmlStrings = xmlStrings.filter(xml => xml !== null);

  if (xmlStrings.length === 0) {
    let alert = new Alert();
    alert.title = "エラー";
    alert.message = "MusicXMLのダウンロードに全て失敗しました";
    alert.addAction("OK");
    await alert.present();
    return;
  }

  console.log(`${xmlStrings.length}個のMusicXMLを正常にダウンロードしました`);
  console.log("MusicXMLを合成中...");
  let combinedXML = combineMusicXML(xmlStrings);

  if (!combinedXML) {
    let alert = new Alert();
    alert.title = "エラー";
    alert.message = "MusicXMLの合成に失敗しました";
    alert.addAction("OK");
    await alert.present();
    return;
  }

  // iCloudに保存
  let fileName = `CombinedMusic_${new Date().toISOString().replace(/[:.]/g, '-').split('T')[0]}.musicxml`;
  let filePath = FileManager.iCloud().documentsDirectory() + "/" + fileName;
  FileManager.iCloud().writeString(filePath, combinedXML);
  console.log(`ファイル保存完了: ${fileName}`);

  // 完了アラート
  let successAlert = new Alert();
  successAlert.title = "完了";
  successAlert.message = `${xmlStrings.length}個のMusicXMLを合成し、\n「${fileName}」として保存しました。\n\nファイルの場所:\n${filePath}`;
  successAlert.addAction("ファイルを共有");
  successAlert.addAction("OK");
  let response = await successAlert.present();

  // 共有アクション
  if (response === 0) {
    try {
      // iCloudファイルの同期を待ってから直接シェアシートへ
      let fm = FileManager.iCloud();
      await fm.downloadFileFromiCloud(filePath);

      let shareSheet = new ShareSheet();
      // ファイルパスを指定して共有 → SeeScore2が「Copy to SeeScore」として表示される
      shareSheet.addFile(filePath);
      await shareSheet.present();

    } catch (shareError) {
      console.error("iCloud共有エラー:", shareError);

      // ローカル一時コピーを使ったフォールバック
      try {
        let localFM = FileManager.local();
        let tempPath = localFM.temporaryDirectory() + "/" + fileName;
        let iCloudFM = FileManager.iCloud();
        let data = iCloudFM.read(filePath);
        localFM.write(tempPath, data);

        let shareSheet = new ShareSheet();
        shareSheet.addFile(tempPath);
        await shareSheet.present();

        // 一時ファイルを削除
        localFM.remove(tempPath);

      } catch (localError) {
        console.error("ローカル共有エラー:", localError);

        // 最終手段としてユーザーへの手動案内
        let errorAlert = new Alert();
        errorAlert.title = "共有できません";
        errorAlert.message = `自動共有に失敗しました。\n手動で共有してください：\n1. ファイルアプリを開く\n2. iCloud Drive > Scriptable > Documents\n3. ${fileName} を選択\n4. 共有ボタンをタップ\n5. SeeScore2 を選択`;
        errorAlert.addAction("ファイルアプリを開く");
        errorAlert.addAction("OK");
        let choice = await errorAlert.present();
        if (choice === 0) {
          Safari.open("shareddocuments://");
        }
      }
    }
  }

} catch (error) {
  console.error("処理エラー:", error);
  let errorAlert = new Alert();
  errorAlert.title = "エラー";
  errorAlert.message = `処理中にエラーが発生しました:\n${error.toString()}`;
  errorAlert.addAction("OK");
  await errorAlert.present();
}
```

-----

### ステップ3: ショートカットの作成

最後に、お子さんが簡単に操作できるように、iPhoneのショートカットアプリでQRコードを連続で読み取るための特別なショートカットを作成します。

以下のステップに沿って、アクションを順番に追加してください。

1.  **アクション「入力から数字を取得」を追加**: ショートカットが開始される際に、外部から受け取った情報の中から数字だけを抽出します。
2.  **アクション「変数 CardCount を 数字 に設定」**: ①で取得した数字を「CardCount」という変数に保存します。
3.  **アクション「CardCount 繰り返す」**: 「CardCount」に設定された回数だけ、この中のアクションを繰り返します。
4.  **アクション「アラート QRコード を撮影します を表示」**: QRコードのスキャンを開始する前にメッセージを表示します。
5.  **アクション「QR またはバーコードをスキャン」**: カメラを起動し、QRコードやバーコードをスキャンします。このアクションは「繰り返し」の中に配置してください。
6.  **アクション「If 繰り返しインデックス が次と等しい 1 の場合」**: 繰り返し処理の「最初の1回目」かどうかを判断します。このアクションも「繰り返し」の中に、⑤の「QRまたはバーコードをスキャン」の下に配置してください。
7.  **アクション「変数 URLList を QR/バーコード に設定」**: 初めてのQRコードをスキャンした場合に、スキャン結果を「URLList」という新しい変数に保存します。このアクションは⑥の「If」の中（「If文」と「その他の場合」の間）に配置してください。
8.  **アクション「その他の場合」**: 繰り返し処理が2回目以降の場合に実行される部分です。⑥の「If」アクションを配置すると自動的に追加されます。
9.  **アクション「QR/バーコード を URLList に追加」**: 2回目以降のQRコードスキャン結果を、既存の「URLList」変数に追加していきます。このアクションは⑧の「その他の場合」の中（「その他の場合」と「If文の終了」の間）に配置してください。
10. **アクション「If文の終了」**: ⑥の「If」条件分岐の終わりを示します。⑥の「If」アクションを配置すると自動的に追加されます。
11. **アクション「繰り返しの終了」**: ③の「繰り返し」処理の終わりを示します。③の「繰り返し」アクションを配置すると自動的に追加されます。
12. **アクション「変数 URLs を URLList に設定」**: 繰り返し処理が終わった後、最終的に作成されたURLのリスト（URLList）を「URLs」という別の変数にコピーします。このアクションは⑪の「繰り返しの終了」の\*\*外側（下）\*\*に配置してください。
13. **アクション「ショートカットを実行 XMLMerge」**: スキャンしたURLのリスト（URLs）を引数として、Scriptableスクリプト「XMLMerge」を実行します。ショートカット名「XMLMerge」を選択し、「`入力`」にマジック変数「変数 URLs」を渡します。

-----

## ▶️ さあ、遊んでみよう！

1.  **1️⃣ カードを並べる**: 好きな順番にMusicXMLカードを並べよう。
2.  **2️⃣ ショートカット実行**: 作成したショートカットをタップして開始！
3.  **3️⃣ 順番にスキャン**: 「QRコードを撮影します」アラートが表示されたら、カードを読み込もう。指定した回数分繰り返します。
4.  **4️⃣ 演奏する**: ショートカットが完了すると、MusicXMLファイルがiCloudに保存され、SeeScore2などの対応アプリで開くか、手動で共有するオプションが表示されます。

-----

## ❓ よくある質問 (FAQ)

### MusicXMLって何？

楽譜をコンピュータで扱うための世界標準のファイル形式です。多くの楽譜作成ソフトや演奏アプリが対応しています。

### エラーが出たときは？

まずはエラーメッセージを確認してください。よくある原因は、QRコードのURLが間違っている（"Raw"でないURLを使っているなど）か、Scriptableのコードが正しくコピーできていないことです。このガイドの手順をもう一度見直してみてください。

### Androidでもできますか？

このガイドはiPhoneの「ショートカット」と「Scriptable」アプリを前提としています。Androidで同様のことをするには、Taskerなどの自動化アプリを使って、似たような処理を自作する必要があります。
