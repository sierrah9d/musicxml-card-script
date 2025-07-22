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

