// ========================================
// XMLMerge-1.1.js
// バージョン履歴
// - v1.1 (2026-05-19):
//   - 文字コード/文言/コメントを UTF-8 前提で統一
//   - エラー文言をユーザー向けと開発者向けに分離
//   - 主要ログへ識別子 [download] [merge] [share] を付与
// ========================================
// ショートカットアプリから URL を受け取り、複数の MusicXML を結合し SeeScore2 へ共有する Scriptable スクリプト
// 保存先: iCloud Drive / Scriptable / Documents

// ショートカットからの入力を受け取る
let urls = args.shortcutParameter;

// URL が配列でない場合は配列化
if (!Array.isArray(urls)) {
  urls = urls ? [urls] : [];
}

function showUserError(title, message) {
  let alert = new Alert();
  alert.title = title;
  alert.message = message;
  alert.addAction("OK");
  return alert.present();
}

function logDeveloperError(context, error) {
  const detail = error && error.stack ? error.stack : String(error);
  console.error(`${context} ${detail}`);
}

// URL が空の場合
if (!urls || urls.length === 0) {
  await showUserError("エラー", "URL が指定されていません。ショートカットの入力を確認してください。");
  return;
}

// 最大 10 件までに制限
urls = urls.slice(0, 10);
console.log(`[download] 対象 URL 数: ${urls.length}`);

// MusicXML をダウンロードする関数
async function downloadMusicXML(url) {
  try {
    let request = new Request(url);
    let response = await request.loadString();
    console.log(`[download] 成功: ${url}`);
    return response;
  } catch (error) {
    logDeveloperError(`[download] 失敗 URL=${url}`, error);
    return null;
  }
}

// MusicXML を簡易 XML ノードに変換する関数
function createXMLNode(name, attributes = {}) {
  return { name, attributes, children: [], text: "" };
}

function escapeXMLText(text) {
  return text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

function escapeXMLAttribute(text) {
  return escapeXMLText(text).replace(/"/g, "&quot;");
}

function cloneNode(node) {
  return {
    name: node.name,
    attributes: { ...node.attributes },
    children: (node.children || []).map(cloneNode),
    text: node.text || ""
  };
}

function findChild(node, name) {
  return (node.children || []).find(c => c.name === name) || null;
}

function findChildren(node, name) {
  return (node.children || []).filter(c => c.name === name);
}

function nodeSignature(node) {
  if (!node) return "";
  return serializeXMLNode(node);
}

function getAttributeState(attributesNode) {
  const state = {};
  if (!attributesNode) return state;
  const keys = ["divisions", "key", "time", "staves"];
  for (let key of keys) state[key] = nodeSignature(findChild(attributesNode, key));
  const clefs = findChildren(attributesNode, "clef");
  state.clef = clefs.map(nodeSignature).join("|");
  return state;
}

function buildAttributesDeltaNode(currentAttributes, previousState) {
  if (!currentAttributes) return null;
  const delta = createXMLNode("attributes");
  const keys = ["divisions", "key", "time", "staves"];
  for (let key of keys) {
    const child = findChild(currentAttributes, key);
    const signature = nodeSignature(child);
    if (signature && previousState[key] !== signature) delta.children.push(cloneNode(child));
  }

  const clefs = findChildren(currentAttributes, "clef");
  const clefSignature = clefs.map(nodeSignature).join("|");
  if (clefSignature && previousState.clef !== clefSignature) {
    for (let clef of clefs) delta.children.push(cloneNode(clef));
  }

  if (delta.children.length === 0) return null;
  return delta;
}

function parseMusicXML(xmlString) {
  if (typeof XMLParser === "undefined") {
    throw new Error("XMLParser が利用できません");
  }
  let root = null;
  let stack = [];
  let parser = new XMLParser(xmlString);

  parser.didStartElement = (name, attrs) => {
    let node = createXMLNode(name, attrs || {});
    if (stack.length > 0) stack[stack.length - 1].children.push(node);
    else root = node;
    stack.push(node);
  };
  parser.didEndElement = () => stack.pop();
  parser.foundCharacters = (text) => {
    if (stack.length > 0 && text) stack[stack.length - 1].text += text;
  };

  parser.parse();
  return root;
}

function serializeXMLNode(node, indent = "") {
  let attrs = Object.entries(node.attributes || {});
  let attrText = attrs.length ? " " + attrs.map(([k, v]) => `${k}="${escapeXMLAttribute(String(v))}"`).join(" ") : "";
  let children = node.children || [];
  let text = node.text || "";
  let hasText = text.trim().length > 0;

  if (!hasText && children.length === 0) return `${indent}<${node.name}${attrText}/>`;
  if (children.length === 0) return `${indent}<${node.name}${attrText}>${escapeXMLText(text)}</${node.name}>`;

  let lines = [`${indent}<${node.name}${attrText}>`];
  if (hasText) lines.push(`${indent}  ${escapeXMLText(text.trim())}`);
  for (let child of children) lines.push(serializeXMLNode(child, indent + "  "));
  lines.push(`${indent}</${node.name}>`);
  return lines.join("\n");
}

function combineMusicXML(xmlStrings) {
  if (xmlStrings.length === 0) return null;
  if (xmlStrings.length === 1) return xmlStrings[0];

  let allMeasures = [];
  let currentMeasureNumber = 1;
  let firstMeasureAttributes = null;
  let combinedPartList = null;
  let selectedPartId = null;
  let sourceScorePart = null;
  let sourcePartName = null;
  let previousMeasureAttributeState = {};

  for (let i = 0; i < xmlStrings.length; i++) {
    let root = parseMusicXML(xmlStrings[i]);
    if (!root || root.name !== "score-partwise") {
      console.log(`[merge] Score ${i + 1}: ルートが score-partwise ではないためスキップ`);
      continue;
    }

    let partList = findChild(root, "part-list");
    let partNodes = findChildren(root, "part");
    if (!partList || partNodes.length === 0) {
      console.log(`[merge] Score ${i + 1}: part-list または part が見つからないためスキップ`);
      continue;
    }

    if (i === 0) {
      combinedPartList = cloneNode(partList);
      selectedPartId = partNodes[0].attributes.id || null;
      sourceScorePart = findChildren(combinedPartList, "score-part").find(sp => sp.attributes.id === selectedPartId) || findChildren(combinedPartList, "score-part")[0] || null;
      sourcePartName = sourceScorePart ? findChild(sourceScorePart, "part-name") : null;
    }

    let targetPart = (selectedPartId && partNodes.find(p => p.attributes.id === selectedPartId)) || partNodes[0];
    let sourceMeasures = findChildren(targetPart, "measure");
    for (let measureIndex = 0; measureIndex < sourceMeasures.length; measureIndex++) {
      let measure = sourceMeasures[measureIndex];
      let m = cloneNode(measure);
      m.attributes.number = String(currentMeasureNumber++);

      const currentAttributes = findChild(m, "attributes");
      const sourceState = getAttributeState(currentAttributes);
      const isBoundaryMeasure = i > 0 && measureIndex === 0;
      const baselineState = isBoundaryMeasure ? {} : previousMeasureAttributeState;
      const deltaAttributes = buildAttributesDeltaNode(currentAttributes, baselineState);

      m.children = m.children.filter(child => child.name !== "attributes");
      if (deltaAttributes) {
        m.children.unshift(deltaAttributes);
        previousMeasureAttributeState = { ...previousMeasureAttributeState, ...sourceState };
      }

      if (i === 0 && !firstMeasureAttributes && currentAttributes) {
        firstMeasureAttributes = cloneNode(currentAttributes);
      }
      allMeasures.push(m);
    }
  }

  if (allMeasures.length === 0) return null;

  let first = allMeasures[0];
  if (firstMeasureAttributes && !first.children.some(c => c.name === "attributes")) {
    first.children.unshift(cloneNode(firstMeasureAttributes));
  }

  let rootNode = createXMLNode("score-partwise", { version: "3.1" });
  let work = createXMLNode("work");
  let workTitle = createXMLNode("work-title");
  workTitle.text = "Sequential Combined MusicXML";
  work.children.push(workTitle);

  let identification = createXMLNode("identification");
  let creator = createXMLNode("creator", { type: "composer" });
  creator.text = "Scriptable Sequential";
  let encoding = createXMLNode("encoding");
  let software = createXMLNode("software");
  software.text = "Scriptable";
  let encodingDate = createXMLNode("encoding-date");
  encodingDate.text = new Date().toISOString().split("T")[0];
  encoding.children.push(software, encodingDate);
  identification.children.push(creator, encoding);

  let finalPartId = selectedPartId || "P1";
  let partListNode = combinedPartList || createXMLNode("part-list");

  let scoreParts = findChildren(partListNode, "score-part");
  let selectedScorePart = scoreParts.find(sp => sp.attributes.id === finalPartId) || scoreParts[0] || null;

  if (!selectedScorePart) {
    selectedScorePart = createXMLNode("score-part", { id: finalPartId });
    partListNode.children.push(selectedScorePart);
  }

  selectedScorePart.attributes.id = finalPartId;
  let selectedPartName = findChild(selectedScorePart, "part-name");
  if (sourcePartName) {
    if (selectedPartName) {
      selectedPartName.text = sourcePartName.text;
    } else {
      selectedScorePart.children.unshift(cloneNode(sourcePartName));
    }
  } else if (!selectedPartName) {
    let partName = createXMLNode("part-name");
    partName.text = "Combined Sequence";
    selectedScorePart.children.unshift(partName);
  }

  let sourceMidiDevice = sourceScorePart ? findChild(sourceScorePart, "midi-device") : null;
  let sourceMidiInstrument = sourceScorePart ? findChild(sourceScorePart, "midi-instrument") : null;
  let currentMidiDevice = findChild(selectedScorePart, "midi-device");
  let currentMidiInstrument = findChild(selectedScorePart, "midi-instrument");

  if (sourceMidiDevice) {
    if (currentMidiDevice) currentMidiDevice.attributes = { ...sourceMidiDevice.attributes };
    else selectedScorePart.children.push(cloneNode(sourceMidiDevice));
  } else if (currentMidiDevice) {
    selectedScorePart.children = selectedScorePart.children.filter(c => c !== currentMidiDevice);
  }

  if (sourceMidiInstrument) {
    if (currentMidiInstrument) {
      currentMidiInstrument.attributes = { ...sourceMidiInstrument.attributes };
      currentMidiInstrument.children = sourceMidiInstrument.children.map(cloneNode);
      currentMidiInstrument.text = sourceMidiInstrument.text;
    } else {
      selectedScorePart.children.push(cloneNode(sourceMidiInstrument));
    }
  } else if (currentMidiInstrument) {
    selectedScorePart.children = selectedScorePart.children.filter(c => c !== currentMidiInstrument);
  }

  if (!sourceMidiDevice && !sourceMidiInstrument) {
    selectedScorePart.children = selectedScorePart.children.filter(c => c.name !== "midi-device" && c.name !== "midi-instrument");
  }

  partListNode.children = [selectedScorePart];

  let partNode = createXMLNode("part", { id: finalPartId });
  partNode.children = allMeasures;

  let partListIds = findChildren(partListNode, "score-part").map(sp => sp.attributes.id).filter(Boolean);
  if (!partListIds.includes(partNode.attributes.id)) {
    throw new Error(`part-list の score-part id (${partListIds.join(",") || "none"}) と part id (${partNode.attributes.id}) が不整合です`);
  }

  rootNode.children.push(work, identification, partListNode, partNode);

  return `<?xml version="1.0" encoding="UTF-8" standalone="no"?>\n` +
    `<!DOCTYPE score-partwise PUBLIC "-//Recordare//DTD MusicXML 3.1 Partwise//EN" "http://www.musicxml.org/dtds/partwise.dtd">\n` +
    serializeXMLNode(rootNode);
}

// 実行開始
console.log("[download] ダウンロード処理を開始");
try {
  let downloadPromises = urls.map(url => downloadMusicXML(url));
  let xmlStrings = await Promise.all(downloadPromises);
  xmlStrings = xmlStrings.filter(xml => xml !== null);

  if (xmlStrings.length === 0) {
    await showUserError("エラー", "MusicXML のダウンロードに失敗しました。URL とネットワーク接続を確認してください。");
    return;
  }

  console.log(`[download] ダウンロード完了: ${xmlStrings.length} 件`);
  console.log("[merge] 結合処理を開始");
  let combinedXML = combineMusicXML(xmlStrings);

  if (!combinedXML) {
    await showUserError("エラー", "MusicXML の結合に失敗しました。入力ファイル形式を確認してください。");
    return;
  }

  // ファイル名を生成（日時付き）
  let now = new Date();
  let year = now.getFullYear();
  let month = String(now.getMonth() + 1).padStart(2, "0");
  let day = String(now.getDate()).padStart(2, "0");
  let hour = String(now.getHours()).padStart(2, "0");
  let minute = String(now.getMinutes()).padStart(2, "0");
  let fileName = `CombinedMusic_${year}${month}${day}_${hour}${minute}.musicxml`;

  // iCloud に保存
  let filePath = FileManager.iCloud().documentsDirectory() + "/" + fileName;
  FileManager.iCloud().writeString(filePath, combinedXML);
  console.log(`[merge] 保存完了: ${fileName}`);

  // 完了通知
  let successAlert = new Alert();
  successAlert.title = "完了";
  successAlert.message = `${xmlStrings.length} 件の MusicXML を結合し、\n「${fileName}」として保存しました。\n\n保存先:\n${filePath}`;
  successAlert.addAction("ファイルを共有");
  successAlert.addAction("OK");
  let response = await successAlert.present();

  // 共有アクション
  if (response === 0) {
    try {
      // iCloud ファイルの同期待機（3 秒）
      console.log("[share] iCloud 同期待機を開始");
      await new Promise(resolve => Timer.schedule(3000, false, resolve));

      let fm = FileManager.iCloud();
      await fm.downloadFileFromiCloud(filePath);

      let shareSheet = new ShareSheet();
      shareSheet.addFile(filePath);
      await shareSheet.present();
      console.log("[share] 共有シート表示に成功");
    } catch (shareError) {
      logDeveloperError("[share] iCloud 共有に失敗", shareError);

      // ローカル一時コピー経由のフォールバック
      try {
        let localFM = FileManager.local();
        let tempPath = localFM.temporaryDirectory() + "/" + fileName;
        let iCloudFM = FileManager.iCloud();
        let data = iCloudFM.read(filePath);
        localFM.write(tempPath, data);

        let shareSheet = new ShareSheet();
        shareSheet.addFile(tempPath);
        await shareSheet.present();
        console.log("[share] ローカル一時ファイルでの共有に成功");

        // 一時ファイルを削除
        localFM.remove(tempPath);
      } catch (localError) {
        logDeveloperError("[share] ローカル共有フォールバックにも失敗", localError);

        // 最終手段としてユーザーへ手動共有を案内
        let errorAlert = new Alert();
        errorAlert.title = "共有できませんでした";
        errorAlert.message = `自動共有に失敗しました。手動で共有してください。\n\n1. ファイルアプリを開く\n2. iCloud Drive > Scriptable > Documents\n3. ${fileName} を選択\n4. 共有ボタンをタップ\n5. SeeScore2 を選択`;
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
  logDeveloperError("[merge] 実行時エラー", error);
  await showUserError("エラー", "処理中に問題が発生しました。時間をおいて再実行してください。");
}
