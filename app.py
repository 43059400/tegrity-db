from selenium import webdriver
import urllib
import re
import sqlite3

chromedriver = "./server/chromedriver"

driver = webdriver.Chrome(chromedriver)
i = 0

def get_items():
    trs = driver.find_element_by_id('tab-drop').find_elements_by_tag_name('tr')

    for tr in trs:
        tds = tr.find_elements_by_tag_name('td')
        if(len(tds) > 0):
            conn = sqlite3.connect('tegrity.db')
            c = conn.cursor()
            item_image = tds[0].find_element_by_tag_name('ins').get_attribute('style')
            item_image = 'https://classicdb.ch/' + re.search(r'\"(.*)\"', item_image).group(1)
            item_image_name = re.split("/", item_image)
            item_image_name = item_image_name[len(item_image_name)-1]
            t = (item_image_name,)
            c.execute('SELECT * FROM images WHERE name=?', t)
            if(c.fetchone() == None):
                urllib.urlretrieve(item_image, "./images/" + item_image_name)
                t = (item_image_name,)
                c.execute("INSERT INTO images (name) VALUES (?)", t)
                conn.commit()
            item_name = tds[1].text
            item_id = re.split("=", tds[1].find_element_by_tag_name('a').get_attribute('href'))[1]
            item_level = tds[2].text

            item_npc = tds[3].text
            item_npc_id = re.split("=", tds[3].find_element_by_tag_name('a').get_attribute('href'))[1]
            t = (item_npc_id,)
            c.execute('SELECT * FROM npcs WHERE id=?', t)
            if(c.fetchone() == None):
                t = (item_npc_id, item_npc,)
                c.execute("INSERT INTO npcs VALUES (?,?)", t)
                conn.commit()
            item_slot = tds[9].text
            item_type = tds[10].text
            item_percentage = tds[11].text
            zone = 3456

            t = (item_id,)
            c.execute('SELECT * FROM items WHERE id=?', t)
            if(c.fetchone() == None):
                t = (item_id, item_name, item_image, item_image_name, item_level, item_npc_id, item_slot, item_type, item_percentage, zone,)
                c.execute("INSERT INTO items VALUES (?,?,?,?,?,?,?,?,?,?)", t)
                conn.commit()
                print(item_id)
            conn.close()

driver.get("https://classicdb.ch/?zone=3456#drop")
while(i<=9250):
    get_items()
    i=i+50
    if(i<=9250):
        driver.find_element_by_xpath('/html/body/div[3]/div[3]/div[6]/div[2]/div[3]/div[3]/div[1]/div[1]/a[3]').click()

