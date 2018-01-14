#! /bin/sh

filename=$1

while read line
do
    sudo python read_latest_data_by_each.py $line $2 $3
done < $1
