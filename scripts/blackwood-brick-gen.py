"""Procedural aged cellar brick, 1 tile = 0.9 x 0.9 m (4 bricks x 12 courses), seamless."""
import numpy as np
from PIL import Image
N=1024; rng=np.random.default_rng(7)
M=0.9; BW,BH,MORT=0.225,0.075,0.010           # brick 215x65 + 10mm joint
px=M/N
y,x=np.mgrid[0:N,0:N]*px
def tile_noise(scale,oct=5,seed=0):
    # seamless value-noise fbm via periodic lattice
    r=np.random.default_rng(seed); out=np.zeros((N,N)); amp=1; tot=0
    for o in range(oct):
        g=int(scale*2**o); lat=r.random((g,g))
        u=x/M*g; v=y/M*g; i0=np.floor(u).astype(int)%g; j0=np.floor(v).astype(int)%g
        fu=u-np.floor(u); fv=v-np.floor(v); fu=fu*fu*(3-2*fu); fv=fv*fv*(3-2*fv)
        i1=(i0+1)%g; j1=(j0+1)%g
        n=(lat[j0,i0]*(1-fu)+lat[j0,i1]*fu)*(1-fv)+(lat[j1,i0]*(1-fu)+lat[j1,i1]*fu)*fv
        out+=amp*n; tot+=amp; amp*=0.5
    return out/tot
row=np.floor(y/BH).astype(int)
off=np.where(row%2==1,BW/2,0)
col=np.floor((x+off)/BW).astype(int)
lx=(x+off)%BW; ly=y%BH
# distance to brick edge, perturbed = chipped arrises
chip=(tile_noise(24,4,1)-0.5)*0.006
d=np.minimum(np.minimum(lx,BW-lx),np.minimum(ly,BH-ly))+chip
face=np.clip((d-MORT/2)/0.004,0,1)            # 0 mortar .. 1 brick face, 4mm rounded arris
bid=(row*5+(col%4))%997
h=np.random.default_rng(3).random(1000)
tone=h[bid]; tone2=np.random.default_rng(5).random(1000)[bid]
grain=tile_noise(40,5,2); blot=tile_noise(4,4,4); fine=tile_noise(160,3,6)
# brick colours: dark fired clay, some burnt headers, soot
base_brick=np.stack([0.16+0.16*tone,0.075+0.07*tone,0.05+0.035*tone],-1)
burnt=(tone2>0.75)[...,None]; base_brick=np.where(burnt,base_brick*np.array([0.42,0.45,0.55]),base_brick)
spall=np.clip((tile_noise(12,4,9)-0.62)*6,0,1)*face   # spalled, rougher patches
base_brick*= (0.6+0.7*grain)[...,None]*(0.75+0.4*fine)[...,None]*(1-0.35*spall)[...,None]
mortar=np.stack([0.10,0.085,0.07])*(0.6+0.7*tile_noise(60,4,8))[...,None]
col_lin=base_brick*face[...,None]+mortar*(1-face[...,None])
col_lin*=(0.45+0.9*blot)[...,None]             # damp / soot blotches
salt=np.clip((tile_noise(6,5,11)-0.66)*4,0,1)*(0.6+0.4*fine)   # efflorescence
col_lin=col_lin*(1-salt[...,None]*0.5)+np.array([0.30,0.28,0.25])*salt[...,None]*0.5
srgb=np.where(col_lin<=0.0031308,12.92*col_lin,1.055*np.power(np.clip(col_lin,0,1),1/2.4)-0.055)
Image.fromarray((np.clip(srgb,0,1)*255+.5).astype(np.uint8)).save("diff_1k.png")
# height → normal (OpenGL +Y), periodic gradients
height=face*0.006 - spall*0.0015 - (1-face)*0.002 + (grain-0.5)*0.0012 + (fine-0.5)*0.0006 - (tone2>0.9)*face*0.001
dx=(np.roll(height,-1,1)-np.roll(height,1,1))/(2*px); dy=(np.roll(height,-1,0)-np.roll(height,1,0))/(2*px)
nrm=np.stack([-dx,dy,np.ones_like(dx)],-1)      # image rows go DOWN, so +Y(up) = -row gradient → +dy
nrm/=np.linalg.norm(nrm,axis=-1,keepdims=True)
Image.fromarray(((nrm*0.5+0.5)*255+.5).astype(np.uint8)).save("nor_gl_1k.png")
rough=np.clip(0.72+0.2*(1-face)+(grain-0.5)*0.25-0.25*np.clip(blot-0.6,0,1)*2,0.3,1)
Image.fromarray((rough*255+.5).astype(np.uint8)).save("rough_1k.png")
for f in ["diff_1k","nor_gl_1k","rough_1k"]:
    Image.open(f+".png").save(f+".webp",quality=88 if f!="nor_gl_1k" else 92,method=6)
Image.open("diff_1k.png").resize((512,512)).save("/tmp/brick_prev.png")
