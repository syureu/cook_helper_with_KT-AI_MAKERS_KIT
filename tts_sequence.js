var food_name;
var food_id;
var food_date_year;
var food_date_month;
var food_date_day;
var food_date_hour;
var food_date_min;
var food_sequence = [];
var sequenceformat = "##";
function readRecipe() {
    //파일 읽기 시작
    var fss = require('fs');
    var readline = require('readline-sync');
    var filename;
    if (filename = readline.question("What is file? : ")) {
        fss.readFile(filename, function (err, data) {
            if (err) throw err;
            //읽은 파일을 한 줄씩 자름
            var array = data.toString().split("\n ");
            //자른 데이터를 한 줄씩 지나가면서 변수에 담기시작.
            for (i in array) {
                console.log(array[i]);              // ####init
                if (array[i] == "####init") {
                    i++;
                    if (array[i] == "##recipe_name") { i++; food_name = array[i]; }
                    else { console.log("파일형태오류"); }
                    i++;
                    if (array[i] == "##identification_number") { i++; food_id = array[i]; }
                    else { console.log("파일형태오류"); }
                    i++;
                    if (array[i] == "##make_date") {
                        i++;
                        var str_temp = array[i].toString().split("/");
                        food_date_year = str_temp[0];
                        food_date_month = str_temp[1];
                        food_date_day = str_temp[2];
                        food_date_hour = str_temp[3];
                        food_date_min = str_temp[4];
                    }
                    else { console.log("파일형태오류"); }
                    i++;
                    if (array[i] == "####sequence") {
                        i++;
                        var strtemp = "";
                        var j = 1;
                        while (true) {
                            strtemp = sequenceformat;
                            strtemp += j;
                            if (strtemp == array[i]) {
                                i++;

                                food_sequence.push(array[i]);
                                i++;
                            }
                            else { console.log("파일형태오류"); }
                            j++;
                            if (array[i] == "####end") { break; } // 마지막 "####end"를 읽었음.
                        }
                        break;      // 다 읽게 된 부분
                    }
                }
            }
            console.log(food_name);
            console.log(food_id);
            console.log(food_date_year);
            console.log(food_date_month);
            console.log(food_date_day);
            console.log(food_date_hour);
            console.log(food_date_min);
            console.log(food_sequence.length);
            for (k in food_sequence) { console.log(food_sequence[k]) } // food_sequence[0], food_sequence[1]....
            //process.on('end_of_read', useSpeaker());
            //process.emit('end_of_read');
            useSpeaker();
        });
    }
    else {
        console.log("파일못읽음.");
        process.exit();
    }
}
function useSpeaker() {
    // 인공지능 스피커 활용 초기화시작.
    const record = require('node-record-lpcm16');       //마이크용
    const aikit = require('./aimakerskitutil');
    const client_id = '';
    const client_key = '';
    const client_secret = '';
    const json_path = './clientKey.json';
    const cert_path = '../data/ca-bundle.pem';
    const proto_path = '../data/gigagenieRPC.proto';
    const kwstext = ['기가지니', '지니야', '친구야', '자기야'];
    const Speaker = require('speaker');     // 스피커용 초기화
    const pcmplay = new Speaker({
        channels: 1,
        bitDepth: 16,
        sampleRate: 16000
    });
    function initMic() {                        //마이크용 초기화
        return record.start({
            sampleRateHertz: 16000,
            threshold: 0,
            verbose: false,
            recordProgram: 'arecord',
            silence: '10.0',
        })
    };
    //파일입출력
    const fs = require('fs');
    //node version check
    const nodeVersion = process.version.split('.')[0];
    let ktkws = null;
    if (nodeVersion === 'v6') ktkws = require('./ktkws');
    else if (nodeVersion === 'v8') ktkws = require('./ktkws_v8');
    //for play sample sound
    const soundBuffer = fs.readFileSync('../data/sample_sound.wav');

    //for setting kws type
    const kwsflag = parseInt(process.argv[2]);
    let res = ktkws.initialize('../data/kwsmodel.pack');
    console.log('Initialize KWS:' + res);
    res = ktkws.startKws(kwsflag);
    console.log('start KWS:' + res);
    //for getting microphone input
    let mic = initMic();

    process.on('initsequence', function () {
        var str_input;                              // 출력할 음성
        str_input = '알려드릴 요리는 ' + food_name + '입니다.';
        //aikit.initialize(client_id,client_key,client_secret,cert_path,proto_path);
        aikit.initializeJson(json_path, cert_path, proto_path);
        kttts = aikit.getText2VoiceStream({ text: str_input, lang: 0, mode: 0 });
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
        function finish() {
            console.log('tts played');
        }
        // if( (count ) == food_sequence.length ) { console.log(count);process.exit();}
    })
    //단계 출력하는 부분의 이벤트
    process.on('nextsequence', function (count) {
        var str_input;                              // 출력할 음성
        if (count >= food_sequence.length) {
            str_input = '다 끝났습니다.';
        }
        else {
            str_input = food_sequence[count];
        }
        //aikit.initialize(client_id,client_key,client_secret,cert_path,proto_path);
        aikit.initializeJson(json_path, cert_path, proto_path);
        kttts = aikit.getText2VoiceStream({ text: str_input, lang: 0, mode: 0 });
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
        function finish() {
            console.log('tts played');
        }
        // if( (count ) == food_sequence.length ) { console.log(count);process.exit();}
    })

    var m = -1;
    mic.on('data', (data) => {
        //push pcm data to ktkws library
        result = ktkws.pushBuffer(data);
        if (result === 1) {
            console.log("KWS Detected");
            //play sample sound
            pcmplay.write(soundBuffer);
            if (m == -1) {
                process.emit('initsequence');
                m++;
            }
            else {
                process.emit('nextsequence', m)         // 정해진 단어 나올 시에, 단계가져옴
                if (m >= food_sequence.length) process.emit('exit_from_menu1');
                m++;

            }                                                   // 다음 단계.
        }
    });
    console.log('say :' + kwstext[kwsflag]);
}
//JSON.stringify(data.recognizedText) == '"지니"'
process.on('exit_from_menu1', function () {
    setTimeout(function () {
        console.log('what?');
        process.exit();
    }, 5000)
});
//readRecipe();
