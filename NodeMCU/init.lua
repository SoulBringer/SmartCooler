-- Common variables
led_pin = 4
val = gpio.LOW

-- WiFi
WIFI_SSID = "zzz"
WIFI_PASS = "zzz"


function blink()
    gpio.write(led_pin, val)
    if val == gpio.LOW then
        val = gpio.HIGH
    else
        val = gpio.LOW
    end
end


function startup()
    tmr.stop(1) --stop blinking
    gpio.write(led_pin, gpio.LOW)
    if file.open("init.lua") == nil then
        print("init.lua deleted or renamed")
    else
        print("Running")
        file.close("init.lua")
        dofile("cooler.lua");
    end
end


function wifiConnect()
    print("Configuring WiFi")
    wifi.setmode(wifi.STATION)
    wifi.sta.config(WIFI_SSID, WIFI_PASS)
    tmr.alarm(0, 1000, tmr.ALARM_AUTO, function()
        if wifi.sta.getip() == nil then
            print("Connecting to AP...")
        else
            ip, nm, gw = wifi.sta.getip()
            
            -- Debug info
            print("IP Info: \nIP Address: ", ip)
            print("Netmask: ", nm)
            print("Gateway Addr: ", gw)
            
            tmr.stop(0)     -- Stop the polling loop
            startup()
        end
    end)    
end


-- consider to move from init
print("You have 3 seconds to abort")
print("Waiting...")
gpio.mode(led_pin, gpio.OUTPUT)
tmr.alarm(1, 150, tmr.ALARM_AUTO, blink)
tmr.alarm(0, 3000, tmr.ALARM_SINGLE, wifiConnect)
