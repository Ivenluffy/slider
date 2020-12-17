## slider.js以滑动方式收展节点元素
//html
<div class='box' style='width:100px;height:200px;border:10px solid #222;padding:20px;background:green;'></div>

//js

var s=new Slider('.box');

s.slideUp(1000);

s.slideDown(1000);

s.slideToggle(1000)
