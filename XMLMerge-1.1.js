// �V���[�g�J�b�g�A�v������URL���󂯎����MusicXML���������ASeeScore2�ɋ��L����Scriptable�X�N���v�g
// iCloud Drive�ɕۑ����ċ��L
// Ver1.1

// �V���[�g�J�b�g����̓��͂��󂯎��
let urls = args.shortcutParameter;

// URL���z��łȂ��ꍇ�͔z��ɕϊ�
if (!Array.isArray(urls)) {
  urls = urls ? [urls] : [];
}

// URL�����݂��Ȃ��ꍇ�̏���
if (!urls || urls.length === 0) {
  let alert = new Alert();
  alert.title = "�G���[";
  alert.message = "URL���n����܂���ł���";
  alert.addAction("OK");
  await alert.present();
  return;
}

// �ő�10�܂łɐ���
urls = urls.slice(0, 10);
console.log(`${urls.length}��URL����MusicXML���_�E�����[�h���܂�`);

// MusicXML���_�E�����[�h����֐�
async function downloadMusicXML(url) {
  try {
    let request = new Request(url);
    let response = await request.loadString();
    console.log(`�_�E�����[�h����: ${url}`);
    return response;
  } catch (error) {
    console.error(`�_�E�����[�h�G���[ ${url}: ${error}`);
    return null;
  }
}

// MusicXML�����ԂɌq����֐�
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
  let attrText = attrs.length ? " " + attrs.map(([k,v]) => `${k}="${escapeXMLAttribute(String(v))}"`).join(" ") : "";
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

  for (let i = 0; i < xmlStrings.length; i++) {
    let root = parseMusicXML(xmlStrings[i]);
    if (!root || root.name !== "score-partwise") {
      console.log(`Score ${i + 1}: ルートが score-partwise ではないためスキップします`);
      continue;
    }

    let partList = findChild(root, "part-list");
    let partNodes = findChildren(root, "part");
    if (!partList || partNodes.length === 0) {
      console.log(`Score ${i + 1}: part-list または part が見つからないためスキップします`);
      continue;
    }

    if (i === 0) {
      combinedPartList = cloneNode(partList);
      selectedPartId = partNodes[0].attributes.id || null;
    }

    let targetPart = (selectedPartId && partNodes.find(p => p.attributes.id === selectedPartId)) || partNodes[0];
    for (let measure of findChildren(targetPart, "measure")) {
      let m = cloneNode(measure);
      m.attributes.number = String(currentMeasureNumber++);
      if (i > 0) {
        m.children = m.children.filter(child => child.name !== "attributes");
      } else if (!firstMeasureAttributes) {
        firstMeasureAttributes = findChild(m, "attributes");
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
  if (findChildren(partListNode, "score-part").length === 0) {
    let scorePart = createXMLNode("score-part", { id: finalPartId });
    let partName = createXMLNode("part-name");
    partName.text = "Combined Sequence";
    scorePart.children.push(partName);
    partListNode.children.push(scorePart);
  }

  let partNode = createXMLNode("part", { id: finalPartId });
  partNode.children = allMeasures;
  rootNode.children.push(work, identification, partListNode, partNode);

  return `<?xml version="1.0" encoding="UTF-8" standalone="no"?>\n` +
    `<!DOCTYPE score-partwise PUBLIC "-//Recordare//DTD MusicXML 3.1 Partwise//EN" "http://www.musicxml.org/dtds/partwise.dtd">\n` +
    serializeXMLNode(rootNode);
}

// ���s�J�n
console.log("�_�E�����[�h�J�n...");
try {
  let downloadPromises = urls.map(url => downloadMusicXML(url));
  let xmlStrings = await Promise.all(downloadPromises);
  xmlStrings = xmlStrings.filter(xml => xml !== null);

  if (xmlStrings.length === 0) {
    let alert = new Alert();
    alert.title = "�G���[";
    alert.message = "MusicXML�̃_�E�����[�h�ɑS�Ď��s���܂���";
    alert.addAction("OK");
    await alert.present();
    return;
  }

  console.log(`${xmlStrings.length}��MusicXML�𐳏�Ƀ_�E�����[�h���܂���`);
  console.log("MusicXML��������...");
  let combinedXML = combineMusicXML(xmlStrings);

  if (!combinedXML) {
    let alert = new Alert();
    alert.title = "�G���[";
    alert.message = "MusicXML�̍����Ɏ��s���܂���";
    alert.addAction("OK");
    await alert.present();
    return;
  }

  // �t�@�C�����𐶐��i�N�����������܂߂�j
  let now = new Date();
  let year = now.getFullYear();
  let month = String(now.getMonth() + 1).padStart(2, '0');
  let day = String(now.getDate()).padStart(2, '0');
  let hour = String(now.getHours()).padStart(2, '0');
  let minute = String(now.getMinutes()).padStart(2, '0');
  let fileName = `CombinedMusic_${year}${month}${day}_${hour}${minute}.musicxml`;
  
  // iCloud�ɕۑ�
  let filePath = FileManager.iCloud().documentsDirectory() + "/" + fileName;
  FileManager.iCloud().writeString(filePath, combinedXML);
  console.log(`�t�@�C���ۑ�����: ${fileName}`);

  // �����A���[�g
  let successAlert = new Alert();
  successAlert.title = "����";
  successAlert.message = `${xmlStrings.length}��MusicXML���������A\n�u${fileName}�v�Ƃ��ĕۑ����܂����B\n\n�t�@�C���̏ꏊ:\n${filePath}`;
  successAlert.addAction("�t�@�C�������L");
  successAlert.addAction("OK");
  let response = await successAlert.present();

  // ���L�A�N�V����
  if (response === 0) {
    try {
      // iCloud�t�@�C���̓�����҂i3�b�ԑҋ@�j
      console.log("iCloud������ҋ@��...");
      await new Promise(resolve => Timer.schedule(3000, false, resolve));
      
      let fm = FileManager.iCloud();
      await fm.downloadFileFromiCloud(filePath);

      let shareSheet = new ShareSheet();
      // �t�@�C���p�X���w�肵�ċ��L �� SeeScore2���uCopy to SeeScore�v�Ƃ��ĕ\�������
      shareSheet.addFile(filePath);
      await shareSheet.present();

    } catch (shareError) {
      console.error("iCloud���L�G���[:", shareError);

      // ���[�J���ꎞ�R�s�[���g�����t�H�[���o�b�N
      try {
        let localFM = FileManager.local();
        let tempPath = localFM.temporaryDirectory() + "/" + fileName;
        let iCloudFM = FileManager.iCloud();
        let data = iCloudFM.read(filePath);
        localFM.write(tempPath, data);

        let shareSheet = new ShareSheet();
        shareSheet.addFile(tempPath);
        await shareSheet.present();

        // �ꎞ�t�@�C�����폜
        localFM.remove(tempPath);

      } catch (localError) {
        console.error("���[�J�����L�G���[:", localError);

        // �ŏI��i�Ƃ��ă��[�U�[�ւ̎蓮�ē�
        let errorAlert = new Alert();
        errorAlert.title = "���L�ł��܂���";
        errorAlert.message = `�������L�Ɏ��s���܂����B\n�蓮�ŋ��L���Ă��������F\n1. �t�@�C���A�v�����J��\n2. iCloud Drive > Scriptable > Documents\n3. ${fileName} ��I��\n4. ���L�{�^�����^�b�v\n5. SeeScore2 ��I��`;
        errorAlert.addAction("�t�@�C���A�v�����J��");
        errorAlert.addAction("OK");
        let choice = await errorAlert.present();
        if (choice === 0) {
          Safari.open("shareddocuments://");
        }
      }
    }
  }

} catch (error) {
  console.error("�����G���[:", error);
  let errorAlert = new Alert();
  errorAlert.title = "�G���[";
  errorAlert.message = `�������ɃG���[���������܂���:\n${error.toString()}`;
  errorAlert.addAction("OK");
  await errorAlert.present();
}
