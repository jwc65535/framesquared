#!/bin/sh

for f in *
do
	p=$f/package.json
	if [ -f $p ]
	then
		echo $p
		grep name $p
	fi

done
		
