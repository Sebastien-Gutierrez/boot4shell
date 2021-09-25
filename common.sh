#!/bin/sh
INST_PATH=/mnt/HD/HD_a2/Nas_Prog/boot4shell
daemon=$INST_PATH/bin/boot4shell
pidfile=$INST_PATH/pid
config_dir=/mnt/HD/HD_a2/Nas_Prog/boot4shell
config_file=$config_dir/boot4shell.config

preinst_sh() {
	mv $config_file /tmp
}

install_sh() {
	path_src=$1
	path_des=$2
	rm -rf $path_des/boot4shell
	mv -f $path_src $path_des
}

remove_sh() {
	killall -q boot4shellDaemon
	killall -q boot4shell
	sleep 1
	LOG_SYMLINK=/var/log/boot4shell.log
	[ -L $LOG_SYMLINK ] && rm -f $LOG_SYMLINK

	path=$1
	rm -f /var/www/boot4shell >/dev/null
	rm -rf $path
}

stop_sh() {
	$daemon -K -P $pidfile
}

init_sh() {
	if [ -f /tmp/boot4shell.config ]; then
		mv /tmp/boot4shell.config $config_dir
	fi
}

start_sh() {
	ln -sf $INST_PATH/ui /var/www/boot4shell
	smb_conf_file="/etc/samba/smb.conf"

	if [ ! -f $config_file ]; then
		mkdir -p $config_dir
		touch $config_file
	fi
	$daemon -D -P $pidfile \
	-c "$config_dir" \
	"SmbConfFile=$smb_conf_file" \
	"AppRoot=$INST_PATH" \
	"WebUIPort=17017" \
	"WebUIAddress=0.0.0.0" \
	"WebUIWWWRoot=${INST_PATH}/www" \
	"CreateLogSymlink=false"
}

clean_sh() {
	rm -f /var/www/boot4shell >/dev/null
}
