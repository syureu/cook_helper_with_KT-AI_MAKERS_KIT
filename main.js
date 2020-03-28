const wpi = require('wiringpi-node');
const record = require('node-record-lpcm16');
const aikit = require('./aimakerskitutil');
const Speaker = require('speaker');
const fs = require('fs');
const sleep = require('sleep');
const microtime = require('microtime');
const soundBuffer = fs.readFileSync('../data/sample_sound.wav');
const pcmplay = new Speaker({
    channels: 1,
    bitDepth: 16,
    sampleRate: 16000
});
//GPIO 설정
//gpio.setup(29,gpio.DIR_IN,gpio.EDGE_BOTH);//버튼 핀은 입력으로
//gpio.setup(31,gpio.DIR_LOW,write);//LED 는 출력으로 설정
var btn = 5;
var btnLed = 6;
var usTrig = 23;
var usEcho = 24;
//var servoPWM = 24;
wpi.setup('gpio');
wpi.pinMode(btn, wpi.INPUT);
wpi.wiringPiISR(btn, wpi.INT_EDGE_FALLING, btnPressed);
wpi.pinMode(btnLed, wpi.OUTPUT);
wpi.pinMode(usTrig, wpi.OUTPUT);
wpi.pinMode(usEcho, wpi.INPUT);
let ktkws = require('./ktkws_v8');
const json_path = './clientKey.json';
const cert_path = '../data/ca-bundle.pem';
const proto_path = '../data/gigagenieRPC.proto';
aikit.initializeJson(json_path, cert_path, proto_path);
let pcm = null;
function initMic() {
    return record.start({
        sampleRateHertz: 16000,
        threshold: 0,
        verbose: false,
        recordProgram: 'arecord',
    })
};
const kwstext = ['기가지니', '지니야', '친구야', '자기야'];
const kwsflag = parseInt(process.argv[2]);
ktkws.initialize('../data/kwsmodel.pack');
ktkws.startKws(kwsflag);
let mic = initMic();
let mode = 0; // 0은 사용자를 인식하기전, 1은 인식하고 나서 메인 메뉴상태
var mode2 = 0;
let ktstt = null;
// 불러서 슬립모드 탈출
mic.on('data', (data) => {
    if (mode === 0) { //1)
        result = ktkws.pushBuffer(data);
        if (result === 1) { //2)
            console.log("KWS Detected");
            flag = 1;
            outofsleep(); // 3)
        }
    } else {
        ktstt.write({ audioContent: data }); //4)
    }
});
console.log('say :' + kwstext[kwsflag]);
// 버튼 눌러서 슬립모드 탈출
function btnPressed() {
    console.log('Channel:GPIO 05 value is \'Pressed \'');
    if (mode2 === 0) {
        flag = 2;
        outofsleep();
    }
}
// 초음파 부분
function pulseIn(pin, state) {
    var MAX_LOOPS = 1000000;
    var numloops = 0;
    while (wpi.digitalRead(pin) != state) {
        if (numloops++ == MAX_LOOPS) return 0;
    }
    var timeStart = microtime.now();
    while (wpi.digitalRead(pin) == state) {
        if (numloops++ == MAX_LOOPS) return 0;
    }
    var timeEnd = microtime.now();
    return timeEnd - timeStart;
}
function trigPulse(pin) {
    wpi.digitalWrite(pin, wpi.LOW);
    sleep.usleep(2);
    wpi.digitalWrite(pin, wpi.HIGH);
    sleep.usleep(20);
    wpi.digitalWrite(pin, wpi.LOW);
}
var degreeIndex = 0;
var degreeDistance = [0];
setInterval(function usControl() {
    if (mode2 === 0) {
        trigPulse(usTrig);
        var duration = pulseIn(usEcho, wpi.HIGH);
        var distance = Math.floor(duration / 58);
        console.log('distance :' + distance + 'cm');
        if (distance < 10) {
            flag = 3;
            outofsleep();
        }
    }
}, 1000);
//초음파 끝

var flag = 1;
var rand = 1;
function getRandomInt(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}
function tts() {
    kttts = aikit.getText2VoiceStream({ text: useStr, lang: 0, mode: 0 });
    kttts.on('error', (error) => {
        console.log('Error:' + error);
    });
    kttts.on('data', (data) => {
        if (data.streamingResponse === 'resOptions' && data.resOptions.resultCd === 200) console.log('Stream send. format:' + data.resOptions.format);
        if (data.streamingResponse === 'audioContent') {
            pcmplay.write(data.audioContent);
        } else console.log('msg received:' + JSON.stringify(data));
    });
    kttts.on('end', () => {
        console.log('pcm end');
    });
}
var i = 0;
function outofsleep() {
    console.log('메인 진입');
    wpi.digitalWrite(btnLed, wpi.HIGH);
    pcmplay.write(soundBuffer);
    mode2 = 1;
    setTimeout(doMain, 3000);
    tts();
};
function doMain() {
    console.log('say something');
    var strData;
    var recipe = "레시피";
    var menu1_1 = "불러";
    var menu1_2 = "알려";
    var menu2_1 = "공유";
    var menu2_2 = "올릴";
    var menu4_1 = "꺼줘";
    var menu4_2 = "안해";
    var menu4_3 = "심심";
    var irecipe;
    var imenu1_1;
    var imenu1_2;
    var imenu2_1;
    var imenu2_2;
    var imenu3_1;
    var imenu3_2;
    var imenu4_1;
    var imenu4_2;
    var imenu4_3;
    ktstt = aikit.getVoice2Text();
    ktstt.on('error', (error) => {
        console.log('Error:' + error);
    });
    ktstt.on('data', (data) => {
        console.log('data:' + JSON.stringify(data));
        strData = JSON.stringify(data.recognizedText);
        irecipe = strData.indexOf(recipe);
        imenu1_1 = strData.indexOf(menu1_1);
        imenu1_2 = strData.indexOf(menu1_2);
        imenu2_1 = strData.indexOf(menu2_1);
        imenu2_2 = strData.indexOf(menu2_2);
        imenu3_1 = strData.indexOf(menu3_1);
        imenu3_2 = strData.indexOf(menu3_2);
        imenu4_1 = strData.indexOf(menu4_1);
        imenu4_2 = strData.indexOf(menu4_2);
        imenu4_3 = strData.indexOf(menu4_3);
    });
    ktstt.on('end', () => {
        console.log('pcm end');
        writeFlag = 0;
        console.log(irecipe);
        console.log(imenu1_1);
        console.log(imenu1_2);
        console.log(imenu2_1);
        console.log(imenu2_2);
        console.log(imenu3_1);
        console.log(imenu3_2);
        console.log(imenu4_1);
        console.log(imenu4_2);
        console.log(imenu4_3);
        if (strData === '""') {
            flag = 4;
            sleepSetting();
        }
        else if (irecipe !== -1) {
            if ((imenu1_1 !== -1) || (imenu1_2) !== -1) {
                flag = 6;
                sleepSetting();
                console.log('1번 메뉴');
            } else if ((imenu2_1 !== -1) || (imenu2_2 !== -1)) {
                flag = 6;
                sleepSetting();
                console.log('2번 메뉴');
            }
        } else if ((imenu4_1 !== -1) || (imenu4_2 !== -1) || (imenu4_3 !== -1)) {
            flag = 7;
            sleepSetting();
            console.log('4번 메뉴');
        }
        else {
            flag = 5;
            sleepSetting();
        }
    });
    ktstt.write({ reqOptions: { mode: 0, lang: 0 } });
    writeFlag = 1;
    mic.on('data', (data) => {
        if (writeFlag === 1) ktstt.write({ audioContent: data });
    });
    mode = 1;
}
function sleepSetting() {
    tts();
    wpi.digitalWrite(btnLed, wpi.LOW);
    i = 0;
    mode = 0;
    mode2 = 0;
}
