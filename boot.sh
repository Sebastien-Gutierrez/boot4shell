#!/bin/sh
LOG_FILE=$INST_PATH/var/log/boot.sh.txt

USER_ROOT=/mnt/HD/HD_a2
DOC_ROOT=/mnt/HD/HD_a2/NoPublic/Documents
IMG_ROOT=/mnt/HD/HD_a2/NoPublic/Images

echo $(date -u) "this is a start shell" >> $LOG_FILE

echo $(date -u) "mkdir for folders" >> $LOG_FILE

mkdir $USER_ROOT/Sebastien/Documents
mkdir $USER_ROOT/Sebastien/Images

echo $(date -u) "mount for folders" >> $LOG_FILE

mount --bind $DOC_ROOT $USER_ROOT/Sebastien/Documents
mount --bind $IMG_ROOT $USER_ROOT/Sebastien/Images

