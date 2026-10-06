import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

const css=fs.readFileSync("styles/tokyo-ghoul.css","utf8");
const color=name=>[...css.matchAll(new RegExp(`--tg-${name}:\\s*(#[a-f0-9]{6})`,"gi"))].at(-1)[1];
function luminance(hex) {
  const rgb=hex.slice(1).match(/../g).map(c=>parseInt(c,16)/255).map(c=>c<=.04045?c/12.92:((c+.055)/1.055)**2.4);
  return rgb[0]*.2126+rgb[1]*.7152+rgb[2]*.0722;
}
function contrast(a,b){const x=luminance(a),y=luminance(b);return (Math.max(x,y)+.05)/(Math.min(x,y)+.05);}
test("normal, muted and accent text meet WCAG AA normal-text contrast across panels",()=>{
  for(const foreground of ["text","muted","accent-strong"]) for(const background of ["bg","panel","panel-strong"]) {
    const ratio=contrast(color(foreground),color(background));
    assert(ratio>=4.5,`${foreground}/${background}: ${ratio.toFixed(2)}`);
  }
  assert(contrast("#ffffff",color("accent"))>=4.5);
});
test("input boundaries and keyboard focus meet non-text contrast",()=>{
  assert(contrast(color("line"),"#0f131d")>=3);
  assert(contrast(color("focus"),color("panel-strong"))>=3);
});
