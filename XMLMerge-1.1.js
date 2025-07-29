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
      console.log(`Part ${i + 1}: part�^�O��������܂���B�X�L�b�v���܂��B`);
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
    console.log("�L���ȃ��W���[��������܂���ł���");
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