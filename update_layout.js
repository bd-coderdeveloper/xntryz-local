const fs = require('fs');
const file = 'd:/BD/BD Test Program/upfeedv3/webapp/src/app/(dashboard)/tools/up-to-reels/page.tsx';

let content = fs.readFileSync(file, 'utf8');
const lines = content.split('\n');

const newJsx = `  return (
    <div className="flex flex-col gap-6">
      <div className="glass-panel p-8 rounded-2xl flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white mb-2">UP TO REELS</h1>
          <p className="text-dark-300">
            อัปโหลด Reels ทีละหลายไฟล์ สามารถดูด TikTok ไม่มีลายน้ำ
          </p>
        </div>
        <div className="w-14 h-14 rounded-2xl bg-orange-500/10 flex items-center justify-center border border-orange-500/20 shadow-inner">
          <Video className="w-7 h-7 text-orange-400" />
        </div>
      </div>

      <div className="bg-dark-900 border border-dark-800 rounded-3xl p-6 shadow-xl grid grid-cols-1 gap-6 divide-y lg:divide-y-0 divide-dark-800">
        <FacebookPageSelector
          onPageSelect={setSelectedPage}
          className=""
        />
      </div>

      <div className="bg-dark-900 border border-dark-800 rounded-2xl flex flex-col h-48 shrink-0 overflow-hidden shadow-xl mb-6">
        <div className="px-4 py-2 border-b border-dark-800 bg-dark-950/80 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-green-500 relative">
              {loading && <div className="absolute inset-0 bg-green-500 rounded-full animate-ping opacity-50"></div>}
            </div>
            <span className="text-[10px] font-bold text-gray-300 uppercase tracking-widest">ผลลัพธ์การทำงาน</span>
          </div>
        </div>
        <div
          ref={logContainerRef}
          className="p-4 flex-1 overflow-y-auto custom-scrollbar font-mono text-[11px] leading-[1.6] select-text bg-dark-950"
        >
          {logs.length === 0 ? (
            <div className="text-dark-600 flex flex-col items-center justify-center h-full gap-2">
              <Type className="w-8 h-8 opacity-20" />
              ระบบพร้อมทำงาน
            </div>
          ) : (
            logs.map((log, i) => {
              const isErr = log.includes('❌') || log.includes('Error') || log.includes('Failed');
              const isSuc = log.includes('✅') || log.includes('Success') || log.includes('สำเร็จ');
              const isSys = log.includes('System') || log.includes('Session');
              return (
                <div key={i} className={\`
                    \${isErr ? 'text-red-400 font-medium' : ''}
                    \${isSuc ? 'text-green-400' : ''}
                    \${isSys ? 'text-blue-400 font-medium' : ''}
                    \${!isErr && !isSuc && !isSys ? 'text-gray-300' : ''}
                    py-1 border-b border-dark-800/30 whitespace-pre-wrap break-words
                  \`}>
                  <span className="text-dark-600 mr-2 opacity-50">[{new Date().toLocaleTimeString('en-US', { hour12: false })}]</span>
                  {log}
                </div>
              );
            })
          )}
        </div>
      </div>

      <div className="bg-dark-900 border border-dark-800 rounded-3xl p-8 shadow-xl">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
          <div className="space-y-6">
            <div className="bg-dark-950 p-6 rounded-2xl border border-dark-800 space-y-6">

              <h3 className="text-white font-semibold flex items-center gap-2 mb-4 border-b border-dark-800 pb-3">
                <Wand2 className="w-5 h-5 text-orange-500" /> ตั้งค่าการอัปโหลด
              </h3>

              <div className="space-y-2">
                <label className="text-sm font-medium text-dark-200">ตั้งค่าดีเลย์ระหว่างคิว (วินาที):</label>
                <div className="flex gap-2 items-center">
                  <input
                    type="number"
                    min={5}
                    max={50}
                    value={delaySeconds}
                    onChange={e => setDelaySeconds(Math.max(5, Math.min(50, parseInt(e.target.value) || 20)))}
                    className="input-primary w-24"
                  />
                  <span className="text-xs text-dark-400 font-medium">(ค่าปลอดภัย: 5-50 วินาที)</span>
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="scheduleToggle"
                    checked={isScheduled}
                    onChange={e => setIsScheduled(e.target.checked)}
                    className="w-4 h-4 rounded appearance-none border border-orange-500 bg-dark-800 checked:bg-orange-500 cursor-pointer form-tick"
                  />
                  <label htmlFor="scheduleToggle" className="text-sm font-medium text-dark-200 cursor-pointer flex items-center gap-1">
                    <Clock className="w-4 h-4 text-orange-400" /> ตั้งเวลาโพสต์ (Schedule)
                  </label>
                </div>
                {isScheduled && (
                  <input
                    type="datetime-local"
                    value={scheduleTime}
                    onChange={e => setScheduleTime(e.target.value)}
                    className="input-primary w-full text-sm mt-3"
                  />
                )}
              </div>

              <div className="pt-4 border-t border-dark-800 space-y-4">
                <div className="flex items-center justify-between">
                  <label className="text-sm font-medium text-dark-200">แคปชั่น</label>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setCaptionMode('FILENAME')}
                      className={\`text-xs px-3 py-1 rounded-full font-medium transition-colors \${captionMode === 'FILENAME' ? 'bg-orange-500/20 text-orange-400' : 'bg-dark-800 text-dark-400'}\`}
                    >
                      ใช้ชื่อวิดีโอ
                    </button>
                    <button
                      onClick={() => setCaptionMode('CUSTOM')}
                      className={\`text-xs px-3 py-1 rounded-full font-medium transition-colors \${captionMode === 'CUSTOM' ? 'bg-orange-500/20 text-orange-400' : 'bg-dark-800 text-dark-400'}\`}
                    >
                      กำหนดเอง
                    </button>
                  </div>
                </div>

                {captionMode === 'CUSTOM' && (
                  <div className="space-y-2">
                    <textarea
                      value={customCaption}
                      onChange={e => setCustomCaption(e.target.value)}
                      placeholder="ใส่แคปชั่นที่คุณต้องการ (รองรับการโพสต์เหมือนกันทุกวิดีโอ)..."
                      rows={4}
                      className="input-primary w-full text-sm leading-relaxed block"
                    />
                  </div>
                )}
              </div>
            </div>

            <button
              onClick={startReelUpload}
              disabled={loading || queue.length === 0}
              className="btn-primary w-full inline-flex items-center justify-center gap-2 py-4 text-lg items-center"
            >
              {loading ? <Loader2 className="w-6 h-6 animate-spin" /> : <Send className="w-6 h-6" />}
              เริ่มอัปโหลด
            </button>
          </div>

          <div className="space-y-6 flex flex-col">
            <div className="bg-dark-950 p-6 rounded-2xl border border-dark-800 space-y-6 flex flex-col">
              <h3 className="text-white font-semibold flex mb-2 items-center justify-between">
                <span>เลือกคิววิดีโอ</span>
                <span className="text-xs text-orange-400">({queue.length}/{MAX_VIDEOS})</span>
              </h3>

              <div className="flex flex-col gap-4">
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <LinkIcon className="h-4 w-4 text-dark-400" />
                    </div>
                    <input
                      type="text"
                      value={tiktokUrl}
                      onChange={e => setTiktokUrl(e.target.value)}
                      placeholder="ใส่ลิ้งค์ TikTok ที่ต้องการดูด..."
                      className="input-primary w-full pl-10"
                    />
                  </div>
                  <button 
                    onClick={extractTikTok}
                    disabled={tiktokLoading}
                    className="px-6 py-2 bg-dark-800 hover:bg-dark-700 border border-dark-700 rounded-xl text-sm font-medium transition-colors flex items-center gap-2"
                  >
                    {tiktokLoading ? <Loader2 className="w-4 h-4 animate-spin"/> : 'TikTok'}
                  </button>
                </div>

                <div className="flex gap-2 items-center">
                   <div className="h-px bg-dark-800 flex-1"></div>
                   <span className="text-xs text-dark-500 font-bold uppercase">หรือ</span>
                   <div className="h-px bg-dark-800 flex-1"></div>
                </div>

                <div>
                  <input
                    type="file"
                    multiple
                    accept="video/mp4,video/quicktime"
                    ref={fileInputRef}
                    onChange={handleFileUpload}
                    className="hidden"
                  />
                  <div
                    onClick={() => fileInputRef.current?.click()}
                    className="w-full h-32 border-2 border-dashed border-dark-700 bg-dark-900 rounded-xl flex items-center justify-center text-dark-400 hover:bg-dark-800 hover:border-orange-500/50 hover:text-orange-400 transition-colors cursor-pointer"
                  >
                    <div className="flex flex-col items-center gap-2">
                      <UploadCloud className="w-8 h-8" />
                      <span className="text-sm font-medium">คลิกเพื่ออัปโหลดหลายไฟล์</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="mt-2 space-y-3 max-h-[300px] overflow-y-auto custom-scrollbar pr-2">
                {queue.map((item, idx) => (
                  <div key={item.id} className="flex flex-col bg-dark-900 border border-dark-700/50 rounded-lg p-3 relative group">
                    <div className="flex items-start justify-between gap-4">
                      <div className="shrink-0 group-hover:scale-105 transition-transform">
                        <label className="cursor-pointer block relative w-16 h-16 rounded overflow-hidden bg-dark-950 border border-dark-700 flex items-center justify-center hover:border-orange-500">
                          {item.thumbnailPreview ? (
                            <img src={item.thumbnailPreview} className="w-full h-full object-cover" alt="Thumb" />
                          ) : (
                            <div className="text-xs text-dark-500 text-center flex flex-col items-center gap-1">
                              <ImageIcon className="w-4 h-4" />
                              <span className="text-[9px]">ใส่ปก</span>
                            </div>
                          )}
                          <input type="file" accept="image/jpeg,image/png" className="hidden" onChange={(e) => handleThumbnailUpload(item.id, e)} />
                        </label>
                      </div>

                      <div className="flex-1 min-w-0 flex flex-col gap-1 justify-center py-1">
                        <div className="flex items-center gap-2 overflow-hidden">
                          <span className="text-xs font-mono font-bold text-dark-500 w-5">{idx + 1}.</span>
                          <span className={\`text-[10px] font-bold px-2 py-0.5 rounded uppercase \${item.source === 'TIKTOK' ? 'bg-purple-500/20 text-purple-400' : 'bg-blue-500/20 text-blue-400'}\`}>
                            {item.source}
                          </span>
                          <span className="text-sm text-dark-200 truncate pr-4" title={item.filename}>{item.filename}</span>
                        </div>

                        <div className="flex items-center gap-3">
                          <span className={\`text-xs font-bold \${item.status === 'SUCCESS' ? 'text-green-400' :
                              item.status === 'ERROR' ? 'text-red-400' :
                                item.status === 'UPLOADING' ? 'text-orange-400' : 'text-dark-500'
                            }\`}>
                            {item.status} {item.status === 'UPLOADING' && <Loader2 className="w-3 h-3 inline animate-spin ml-1" />}
                          </span>
                        </div>
                      </div>

                      <div className="shrink-0 flex pt-1">
                        {item.status === 'IDLE' && (
                          <button onClick={() => removeQueue(item.id)} className="text-dark-500 hover:text-red-400 transition-colors p-2">
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </div>
                    {item.errorMsg && <div className="text-[10px] text-red-500 mt-2 p-2 bg-red-500/10 rounded">{item.errorMsg}</div>}
                  </div>
                ))}
                {queue.length === 0 && (
                  <div className="text-center py-6 text-dark-500 text-sm font-medium">ไม่มีวิดีโอในคิว...</div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}`;

let outLines = [];
let insideReturn = false;

for (let i = 0; i < lines.length; i++) {
  if (lines[i].trim().startsWith('return (')) {
    insideReturn = true;
    outLines.push(newJsx);
  }

  if (insideReturn && lines[i].trim() === '}') {
    // We hit the last brace (the closing brace for the whole component), meaning `return` is over before it
    // Wait, the newJsx doesn't close the component brace `}`, it only closes `return (...);`.
    // We should let it continue from `}`.
    insideReturn = false;
    outLines.push('}');
    break;
  }

  if (!insideReturn) {
    outLines.push(lines[i]);
  }
}

fs.writeFileSync(file, outLines.join('\n'));
console.log("Updated UI!");
