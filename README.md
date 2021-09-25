# boot4shell
This is MyCloud OS5 application wich allow to run scripts on boot

You need the packager mksapkg-OS5 from WD https://github.com/WDCommunity/wdpksrc 

I package the app under Ubuntu 20.04 (x64) with the command line and using the template MyCloudEX2Ultra
(please read documentation about mksapkg-OS5) 

cd ./boot4shell

./mksapkg-OS5 -s -m MyCloudEX2Ultra

The resulting bin file will be generated at the parent folder of ./boot4shell 
remove the date stamp at the end of the file and keep the .bin extension (MyCloudEX2Ultra_boot4shell_0.0.1.bin)

Manually install the app from your WD Cloud ui then modify the boot.sh in the /mnt/HD/HD_a2/Nas_Prog/boot4shell folder. 
Once installed don't forget to activate the app 
