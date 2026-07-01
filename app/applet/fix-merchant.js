const fs = require('fs');
let content = fs.readFileSync('src/pages/MerchantSaaS.tsx', 'utf8');
const idx = content.lastIndexOf('PRIX DE VENTE');
if (idx !== -1) {
    content = content.substring(0, idx) + `PRIX DE VENTE</span>
                    <span className="text-lg font-black text-violet-400">
                      {previewImage.price?.toLocaleString()} {merchant?.currency || 'FCFA'}
                    </span>
                  </div>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

export default MerchantSaaS;
`;
    fs.writeFileSync('src/pages/MerchantSaaS.tsx', content);
    console.log('Fixed end of file');
} else {
    console.log('PRIX DE VENTE not found');
}
