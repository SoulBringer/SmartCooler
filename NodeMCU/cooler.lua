temp = require("ds18b20")


-- Common variables
temp_pin = 6
led_pin = 4
scale_clk_pin = 2
scale_data_pin = 3

mqtt_host = "zzz.iot.eu-west-1.amazonaws.com"
mqtt_port = 8883
mqtt_name = "SmartCooler"
mqtt_login = "zzz"
mqtt_password = "zzz"
mqtt_topic_prefix = "office/sensors/cooler/"

-- Port setup
gpio.mode(led_pin, gpio.OUTPUT)
gpio.write(led_pin, gpio.LOW)
temp.setup(temp_pin)
temp.read()
hx711.init(scale_clk_pin, scale_data_pin)


-- Schedule temp data sending
function schedule_mqtt_send(interval)
    tmr.stop(0)
    tmr.alarm(0, interval, tmr.ALARM_AUTO, function()
        --gpio.write(led_pin, gpio.LOW)
        local tval = temp.read()
        print("Temperature: " .. tval)

        local sval = hx711.read(0)
        print("Weight: " .. sval)

        local payload = "{\"temp\":" .. tval .. ",\"weight\":" .. sval .. "}"
        -- publish a message with QoS = 0, retain = 0
        mqtt:publish(mqtt_topic_prefix .. "data", payload, 0, 0, function(conn) 
            print("MQTT data sent") 
            gpio.write(led_pin, gpio.LOW)
            tmr.alarm(1, 1000, tmr.ALARM_SINGLE, function()
                tmr.stop(1)
                gpio.write(led_pin, gpio.HIGH)
            end)
        end)
    end)
    print("Temperature update inretval set to: " .. interval)
end


-- Main entry point
function main()
    print("Configuring MQTT")
    --tls.cert.verify(true)
    mqtt = mqtt.Client(mqtt_name, 120, mqtt_login, mqtt_password)
    
    mqtt:on("offline", function(conn) 
        print ("MQTT offline")
        tmr.stop(0)
    end)
    
    mqtt:on("message", function(conn, topic, data)
        if topic == mqtt_topic_prefix .. "setting/light" then
            if data == "on" then
                gpio.write(led_pin, gpio.LOW)
                mqtt:publish(mqtt_topic_prefix .. "settings", "{\"light\":\"on\"}", 0, 0)
            elseif data == "off" then
                gpio.write(led_pin, gpio.HIGH)
                mqtt:publish(mqtt_topic_prefix .. "settings", "{\"light\":\"off\"}", 0, 0)
            end
        elseif topic == mqtt_topic_prefix .. "setting/interval" then
            local val = tonumber(data)
            if val ~= nil then
                schedule_mqtt_send(val)
            end
            mqtt:publish(mqtt_topic_prefix .. "settings", "{\"interval\":\"" .. data ..  "\"}", 0, 0)
        else
            print("Unknown MQTT message: " .. topic .. ":" .. data)
        end
    end)

    -- Enable SSL by 3rd parameter set to 1
    mqtt:connect(mqtt_host, mqtt_port, 1, 0,
        function(conn) 
            print("MQTT connected")
            -- subscribe topic with qos = 0
            mqtt:subscribe(mqtt_topic_prefix .. "setting/light", 0)
            mqtt:subscribe(mqtt_topic_prefix .. "setting/interval", 0)
    
            schedule_mqtt_send(10*1000)
        end,
        function(conn, reason) 
            print("MQTT NOT connected: " .. reason)
        end
    )
        
    print("Initialized")
    gpio.write(led_pin, gpio.HIGH)
end


-- Execute main
main()
