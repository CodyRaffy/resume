import shutil
import sys
import os


def getIndexHtml():
    navbarHtml = ""

    indexFile = open("./../index.html", "r")

    append = False
    for line in indexFile:

        if append:
            navbarHtml += line
            if "</nav>" in line:
                append = False
        elif "<nav " in line:
            navbarHtml += line
            append = True

    indexFile.close()
    return navbarHtml


def findAllHtmlFiles():
    htmlFiles = []
    rootDir = './../'
    for dirName, subdirList, fileList in os.walk(rootDir):
        for f in fileList:
            if f.endswith('.html') and f != 'index.html':
                htmlFiles.append(os.path.join(dirName, f))

    return htmlFiles

def replaceNavbar(navbarHtml, htmlFile):
    shutil.move( htmlFile, htmlFile+"~" )

    destination= open( htmlFile, "w" )
    source= open( htmlFile+"~", "r" )
    append= True

    for line in source:
        if append:
            if "<nav " in line:
                destination.write(navbarHtml)
                append= False
            else:
                destination.write(line)
        elif "</nav>" in line:
            append=True

    source.close()
    destination.close()
    os.remove(htmlFile+"~")


navbarHtml = getIndexHtml()
#sys.stdout.write(navbarHtml)

htmlFiles = findAllHtmlFiles()
#sys.stdout.write("Found %s files" % len(htmlFiles))

for file in htmlFiles:
    replaceNavbar(navbarHtml, file)
