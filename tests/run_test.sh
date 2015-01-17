#!/bin/sh

workpath=$(cd `dirname $0`; pwd)/
cd ${workpath}
sh ../build/build.sh
rm tests.js
rm tests.d.ts
rm tests.js.map
find ../tests -name "*.ts" >> files.txt
tsc -d @files.txt --out tests.js -t ES5  --sourceMap
rm files.txt

#../node_modules/phantom-jasmine/bin/phantom-jasmine TestRunner.html

cd $PWD