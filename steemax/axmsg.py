#!/usr/bin/python3

import logging

LOGFORMAT = "%(asctime)s %(levelname)s - %(message)s - %(pathname)s"
logging.basicConfig(filename = "error.log", level = logging.DEBUG, format = LOGFORMAT)
logger = logging.getLogger()

class AXmsg:

    def __init__(self):
        self.mode = ""

    def x_message(self, msg):
        if self.mode != "quiet":
            print (msg)
        logger.info(msg)

    def x_error_message(self, msg):
        if self.mode != "quiet":
            print (msg)
        logger.error(msg)
