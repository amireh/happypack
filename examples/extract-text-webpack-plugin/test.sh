diff "./happy/less.css" "./vanilla/less.css"
diff "./happy/sass.css" "./vanilla/sass.css"

grep "color: red;"      "./happy/less.css"
grep "font-size: 26px;" "./happy/sass.css"
