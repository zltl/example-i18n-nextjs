import 'server-only';
import type { Locale } from './i18n-config';
import fs from 'fs';
import path from 'path';

interface DicType {
    [key: string]: any
}

// We enumerate all dictionaries here for better linting and typescript support
// We also get the default import for cleaner types
let dictionaries: DicType = {
    resolved: false,
}

async function getFieldsFromDir(filePath: string): Promise<DicType> {
    let dic: DicType = {};
    const stat = await fs.promises.stat(filePath);
    if (stat.isFile() && filePath.endsWith('.json')) {
        // read json and return
        const content = await fs.promises.readFile(filePath, 'utf-8');
        const contentJson = JSON.parse(content);
        dic = contentJson;
        return dic;
    }

    // ./en/common.json 
    // ./en/footer.json 
    // ./en/content/xyz.json
    // => {en: {
    //              common: {}, 
    //              footer: {}, 
    //              content: {
    //                      xyz: {}
    // }}}
    if (stat.isDirectory()) {
        const dirent = await fs.promises.readdir(filePath);
        for (const file of dirent) {
            const subDic = await getFieldsFromDir(path.join(filePath, file));
            let fieldName = file;
            const subFilePath = path.join(filePath, file);
            const stat = await fs.promises.stat(subFilePath);
            if (stat.isFile() && subFilePath.endsWith('.json')) {
                fieldName = file.substring(0, file.length - 5);
            }
            dic[fieldName] = subDic;
        }

        return dic;
    }

    throw new Error('Invalid dictionary file path: ' + filePath);
}

export const getDictionary = async (locale: Locale) => {
    if (!dictionaries.resolved) {
        const dictPath = './dictionaries';
        const dictDir = path.join(process.cwd(), dictPath);
        const dic = await getFieldsFromDir(dictDir)
        dictionaries = { ...dictionaries, ...dic };
        dictionaries.resolved = true;
    }
    console.log("DICT: ", dictionaries);

    return dictionaries[locale];
}

