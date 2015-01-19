#!/bin/sh

version=0.5.1

workpath=$(cd `dirname $0`; pwd)/
cd ${workpath}
echo "clean"
rm -R dist
echo "compile ts"
find ../src ../extensions/DragonBones -name "*.ts" >> files.txt
tsc -d @files.txt --out dist/WOZLLA.${version}.js -t ES5
cp dist/WOZLLA.${version}.d.ts ../libs
rm files.txt
echo "combine dependencies"
cat ../libs/hammer.1.1.3.js ../libs/DragonBones.js dist/WOZLLA.${version}.js > dist/WOZLLA.${version}.all.js
cp dist/WOZLLA.${version}.all.js ../examples/WOZLLA.all.js
echo "minify js"
java -jar compiler.jar dist/WOZLLA.${version}.all.js --js_output_file=dist/WOZLLA.${version}.all.min.js
cd ../
echo "generate api doc"
#jsduck --config=jsduckconfig.json
cd $PWD