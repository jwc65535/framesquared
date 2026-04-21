#!/bin/sh

for f in *
do
	p=$f/package.json
	if [ -f $p ]
	then
		echo $p
		if grep '"name"' $p
		then
		  echo OKAY
		  sed -i 's/\("name": "@framesquared\/sample-\).*/\1'$f'",/' $p
    fi
	fi

done

